import { ansiStyles, Logger } from '@/logger.0.ts';
import { Bounds3D, Point3D } from '@/point3d.0.ts';
import { Utils } from '@/utils.0.ts';

const methods = ['smallInt', 'smallIntUnsafe', 'main'] as const;
const tests = ['smallInt', 'largeInt', 'smallFloat', 'largeFloat'] as const;
const operations = ['pack', 'unpack'] as const;
const runs = 10;
const length = Deno.args.includes('-fast') ? 1_000 : 1_000_000;
const PASS = `${ansiStyles.bold}${ansiStyles.fgIntense.green}PASS${ansiStyles.reset}`;
const FAIL = `${ansiStyles.bold}${ansiStyles.fgIntense.red}FAIL${ansiStyles.reset}`;

type Method = (typeof methods)[number];
type Test = (typeof tests)[number];
type Operation = (typeof operations)[number];

const logger = new Logger(import.meta.url);

const results: Record<Method, Record<Test, (Record<Operation, number> & { pass: boolean })[]>> = {
  smallInt: {
    smallInt: [],
    largeInt: [],
    smallFloat: [],
    largeFloat: [],
  },
  smallIntUnsafe: {
    smallInt: [],
    largeInt: [],
    smallFloat: [],
    largeFloat: [],
  },
  main: {
    smallInt: [],
    largeInt: [],
    smallFloat: [],
    largeFloat: [],
  },
};

const makePoints = (test: Test) => {
  const make = () => {
    switch (test) {
      case 'largeFloat':
        return (Math.random() - 0.5) * Number.MAX_SAFE_INTEGER;
      case 'largeInt':
        return Math.round((Math.random() - 0.5) * Number.MAX_SAFE_INTEGER);
      case 'smallFloat':
        return (Math.random() - 0.5) * 1000;
      case 'smallInt':
        return Math.round((Math.random() - 0.5) * 1000);
      default:
        throw new Error(`invalid makePoints test: ${test}`);
    }
  };
  return Array.from({ length }, () => new Point3D(make(), make(), make()));
};

const pack = (method: Method, points: Point3D[], bounds: Bounds3D) => {
  const packer = Point3D.makeSmallIntPacker(bounds);
  switch (method) {
    case 'smallInt':
      return points.map(packer.pack);
    case 'smallIntUnsafe':
      return points.map(packer.packUnsafe);
    case 'main':
      return points.map(Point3D.pack);
    default:
      throw new Error(`invalid pack method: ${method}`);
  }
};

const unpack = (method: Method, packed: number[] | bigint[], bounds: Bounds3D) => {
  const packer = Point3D.makeSmallIntPacker(bounds);
  switch (method) {
    case 'smallInt':
      return (packed as number[]).map(packer.unpack);
    case 'smallIntUnsafe':
      return (packed as number[]).map(packer.unpackUnsafe);
    case 'main':
      return (packed as bigint[]).map(Point3D.unpack);
    default:
      throw new Error(`invalid pack method: ${method}`);
  }
};

for (const test of tests) {
  for (const method of methods) {
    for (let run = 0; run < runs; ++run) {
      try {
        const points = makePoints(test);
        const bounds = Point3D.getBounds(points);

        const packStart = performance.now();
        const packed = pack(method, points, bounds);
        const packTime = performance.now() - packStart;

        const unpackStart = performance.now();
        const unpacked = unpack(method, packed, bounds);
        const unpackTime = performance.now() - unpackStart;

        const pass = unpacked.length === points.length && unpacked.every((point, i) => points[i].isEqual(point));

        logger[pass ? 'debugLow' : 'warn']({ test, method, run, pack: Utils.roundTo(packTime), unpack: Utils.roundTo(unpackTime), pass });
        results[method][test].push({ pack: packTime, unpack: unpackTime, pass });
      } catch (err) {
        logger.warn({ test, method, run }, String(err));
        results[method][test].push({ pack: -1, unpack: -1, pass: false });
      }
    }
  }
}

Object.entries(results).forEach(([method, methodData]) => {
  const methodPass = Object.values(methodData).flat().every(({ pass }) => pass);
  // deno-lint-ignore no-console
  console.log(`\n${method}: ${methodPass ? PASS : FAIL}`);
  Object.entries(methodData).forEach(([test, testData]) => {
    const testPass = testData.every(({ pass }) => pass);
    // deno-lint-ignore no-console
    console.log(`  ${test}: ${testPass ? PASS : FAIL}`);
    for (const operation of operations) {
      const times = testData.map((item) => item[operation]).filter((item) => item !== -1);
      const [min, max] = Utils.minMax(...times).map(Utils.roundTo);
      const avg = Utils.roundTo(Utils.mean(...times));
      const throws = runs - times.length;
      // deno-lint-ignore no-console
      console.log(`    ${operation}`, { min, max, avg, throws });
    }
  });
});
