/** this needs to be run with the `--expose-gc` v8 flag
 *
 * e.g.: `deno run --v8-flags=--expose-gc test/point2d-pack.ts`
 */

import { ansiStyles, Logger } from '@/logger.0.ts';
import { Offset2D, Point2D, Point2DLike } from '@/point2d.0.ts';
import { Utils } from '@/utils.0.ts';
import { HashedSet } from '@/hashed-set.0.ts';

const [runs, length] = Deno.args.includes('-vfast') ? [1, 1000] : Deno.args.includes('-fast') ? [5, 1_000_000] : [10, 10_000_000];
const logger = new Logger(import.meta.url);

const tests = ['smallInt', 'smallFloat', 'largeInt', 'largeFloat'] as const;
type Test = (typeof tests)[number];

const methods = [
  'pack',
  'pack32',
  // 'packSi',
] as const;
type Method = (typeof methods)[number];

const results = new Map<Method, Record<Test, { pack: number; unpack: number; set: number; rate: number }[]>>();

const makePoints = (test: Test): Point2DLike[] => {
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
    const arr: Point2DLike[] = [];
    const bound = Math.ceil(Math.sqrt(length) / 2);
    for (let x = -bound; x < bound; ++x) {
      for (let y = -bound; y < bound; ++y) {
        arr.push({ x, y });
        if (arr.length === length) return arr;
      }
    }
    throw new Error('did not generate smallInt input array');
  } else {
    const set = new HashedSet(Point2D.pack);
    while (set.size < length) {
      const center = { x: make(), y: make() };
      for (const point of [center, ...Point2D.neighbours(center, 3, Offset2D.Square)]) {
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

for (let run = 0; run < runs; ++run) {
  for (const test of tests.toSorted(() => Math.random() - 0.5)) {
    logger.debugMed(test, 'generating', { run, length });
    const input = makePoints(test);
    // const packer = Point2D.makeSmallIntPacker(Point2D.bounds(input));
    for (const method of methods.toSorted(() => Math.random() - 0.5)) {
      const packed = new Array(input.length);
      let i = 0;
      await gc();
      logger.debugMed('  packing', { method });

      const packStarted = performance.now();
      if (method === 'pack') { for (const item of input) packed[i++] = Point2D.pack(item); }
      else if (method === 'pack32') { for (const item of input) packed[i++] = Point2D.pack32(item); }
      // else if (method === 'packSi') { for (const item of input) packed[i++] = packer.packUnsafe(item); }
      else { throw new Error(`unhandled pack method ${method}`); }
      const packTime = performance.now() - packStarted;

      const unpacked = new Array(input.length);
      i = 0;
      await gc();
      logger.debugMed('  unpacking', { method });
      const unpackStarted = performance.now();
      if (method === 'pack') { for (const item of packed) unpacked[i++] = Point2D.unpack(item); }
      else if (method === 'pack32') { for (const item of packed) unpacked[i++] = Point2D.unpack32(item); }
      // else if (method === 'packSi') { for (const item of packed) unpacked[i++] = packer.unpackUnsafe(item); }
      else { throw new Error(`unhandled unpack method ${method}`); }
      const unpackTime = performance.now() - unpackStarted;

      await gc();
      logger.debugMed('  adding to set', { method });
      const setStarted = performance.now();
      const _set = new Set(packed);
      const setTime = performance.now() - setStarted;

      logger.debugMed('  checking', { method });
      const matchCount = input.map((item, i) => Point2D.isEqual(unpacked[i], item)).filter((item) => item).length;
      const mismatchCount = input.length - matchCount;
      const failureRate = mismatchCount / (input.length || 1);

      logger.debugLow('  ', { packTime, unpackTime, setTime, failureRate: `${failureRate * 100}%` });
      if (!results.has(method)) results.set(method, { largeFloat: [], largeInt: [], smallFloat: [], smallInt: [] });
      results.get(method)?.[test].push({ pack: packTime, rate: failureRate, set: setTime, unpack: unpackTime });
    }
  }

  for (const method of methods) {
    logger.info(ansiStyles.bold, method, ansiStyles.reset, { run });
    for (const test of tests) {
      logger.info('  ', ansiStyles.bold, test, ansiStyles.reset);
      for (const resultType of ['rate', 'pack', 'unpack', 'set'] as const) {
        const data = results.get(method)?.[test].map((item) => item[resultType]);
        if (!data) continue;
        const [min, max] = Utils.minMax(...data).map((item) => resultType === 'rate' ? `${Utils.roundTo(item * 100, 5)}%` : Utils.roundTo(item));
        const avg = resultType === 'rate' ? `${Utils.roundTo(Utils.mean(...data) * 100, 5)}%` : Utils.roundTo(Utils.mean(...data));
        logger.info('    ', resultType, { min, max, avg });
      }
    }
  }
}
