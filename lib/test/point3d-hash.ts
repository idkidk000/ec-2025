/** this needs to be run with the `--expose-gc` v8 flag
 *
 * e.g.: `deno run --v8-flags=--expose-gc test/point3D-hash.ts`
 */

import { ansiStyles, LogDate, Logger } from '@/logger.0.ts';
import { Point3D, Point3DLike } from '@/point3d.0.ts';
import { Utils } from '@/utils.0.ts';
import { HashedSet } from '@/hashed-set.0.ts';

const [runs, length] = Deno.args.includes('-vfast') ? [1, 1000] : Deno.args.includes('-fast') ? [5, 1_000_000] : [10, 10_000_000];
const logger = new Logger(import.meta.url, undefined, { logDate: LogDate.Time });

const tests = ['smallInt', 'smallFloat', 'largeInt', 'largeFloat'] as const;
type Test = (typeof tests)[number];

const methods = [
  'hash',
  // 'hash2',
  // 'hash3',
  // 'hash4',
  'pack',
  'pack32',
  // 'pack16',
  // 'packSi',
  'packFloat21',
  'packInt21',
] as const;
type Method = (typeof methods)[number];

const makePoints = (test: Test): Point3DLike[] => {
  const make = () => {
    switch (test) {
      case 'largeFloat':
        return (Math.random() - 0.5) * Number.MAX_SAFE_INTEGER;
      case 'largeInt':
        return Math.round((Math.random() - 0.5) * Number.MAX_SAFE_INTEGER);
      case 'smallFloat':
        return (Math.random() - 0.5) * 2 * 10_000;
      // case 'smallInt':
      //   return Math.round((Math.random() - 0.5) * 2 * (length / 100));
      default:
        throw new Error(`invalid makePoints test: ${test}`);
    }
  };
  if (test === 'smallInt') {
    const arr: Point3DLike[] = [];
    const bound = Math.ceil(Math.cbrt(length) / 2);
    for (let x = -bound; x < bound; ++x) {
      for (let y = -bound; y < bound; ++y) {
        for (let z = -bound; z < bound; ++z) {
          arr.push({ x, y, z });
          if (arr.length === length) return arr;
        }
      }
    }
    throw new Error('did not generate smallInt input array');
  } else {
    const set = new HashedSet(Point3D.pack);
    while (set.size < length) {
      const center = { x: make(), y: make(), z: make() };
      for (const point of [center, ...Point3D.neighbours(center, 26)]) {
        set.add(point);
        if (set.size === length) break;
      }
    }
    return [...set];
  }
};

const gc = () => {
  // logger.debugHigh('  gc');
  // @ts-expect-error shush it's fine
  // deno-lint-ignore no-node-globals
  global?.gc({ type: 'major', execution: 'sync' });
  return new Promise((resolve) => setTimeout(resolve, 1_000));
};

const results = new Map<Method, Record<Test, { rate: number; exec: number; set: number }[]>>();

for (let run = 0; run < runs; ++run) {
  for (const test of tests.toSorted(() => Math.random() - 0.5)) {
    logger.debugMed(test, 'generating', { run, length });
    const input = makePoints(test);
    // const packer = Point3D.makeSmallIntPacker(Point3D.bounds(input));
    for (const method of methods.toSorted(() => Math.random() - 0.5)) {
      const output = new Array(input.length);
      let i = 0;
      await gc();
      logger.debugMed('  running', { method });

      const execStarted = performance.now();
      if (method === 'hash') { for (const item of input) output[i++] = Point3D.hash(item); }
      else if (method === 'pack') { for (const item of input) output[i++] = Point3D.pack(item); }
      else if (method === 'pack32') { for (const item of input) output[i++] = Point3D.pack32(item); }
      else if (method === 'packFloat21') { for (const item of input) output[i++] = Point3D.packFloat21(item); }
      else if (method === 'packInt21') { for (const item of input) output[i++] = Point3D.packInt21(item); }
      else { throw new Error(`unhandled method ${method}`); }
      const execTime = performance.now() - execStarted;

      await gc();
      logger.debugMed('  checking', { method });
      const setStarted = performance.now();
      // Set cannot handle the output of Point3D.pack when the inputs were small integers. I guess it's an alignment/optimisation bug. Seeding the set with a 192 bit bigint doesn't make any difference. Converting to a string allows the script to continue. But you shouldn't be using `pack` as a unique key anyway.
      const hashes = new Set(output.length && typeof output[0] === 'bigint' ? output.map(String) : output);
      const setTime = performance.now() - setStarted;
      const rate = (length - hashes.size) / length;

      if (!results.has(method)) results.set(method, { largeFloat: [], largeInt: [], smallFloat: [], smallInt: [] });
      results.get(method)?.[test].push({ rate, exec: execTime, set: setTime });
      logger.debugLow('  ', { method, rate: rate * 100, execTime, setTime });
    }
  }

  for (const method of methods) {
    logger.info(ansiStyles.bold, method, ansiStyles.reset, { run });
    for (const test of tests) {
      logger.info('  ', ansiStyles.bold, test, ansiStyles.reset);
      for (const resultType of ['rate', 'exec', 'set'] as const) {
        const data = results.get(method)?.[test].map((item) => item[resultType]);
        if (!data) continue;
        const [min, max] = Utils.minMax(...data).map((item) => resultType === 'rate' ? `${Utils.roundTo(item * 100, 5)}%` : Utils.roundTo(item));
        const avg = resultType === 'rate' ? `${Utils.roundTo(Utils.mean(...data) * 100, 5)}%` : Utils.roundTo(Utils.mean(...data));
        logger.info('    ', resultType, { min, max, avg });
      }
    }
  }
}
