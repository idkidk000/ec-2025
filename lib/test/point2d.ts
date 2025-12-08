import { ansiStyles, Logger } from '@/logger.0.ts';
import { Bounds2D, Point2D } from '@/point2d.0.ts';
import { Utils } from '@/utils.0.ts';

const methods = ['smallInt', 'smallIntUnsafe', 'main', 'hash'] as const;
const tests = ['smallInt', 'largeInt', 'smallFloat', 'largeFloat'] as const;
const operations = ['pack', 'unpack'] as const;
const [runs, length] = Deno.args.includes('-vfast') ? [1, 1000] : Deno.args.includes('-fast') ? [5, 500_000] : [10, 1_000_000];
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
  hash: {
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
  return Array.from({ length }, () => new Point2D(make(), make()));
};

const pack = (method: Method, points: Point2D[], bounds: Bounds2D) => {
  const packer = Point2D.makeSmallIntPacker(bounds);
  const packed = new Array(points.length);
  let i = 0;
  const started = performance.now();
  switch (method) {
    case 'smallInt':
      for (const point of points) packed[i++] = packer.pack(point);
      break;
      // return points.map(packer.pack);
    case 'smallIntUnsafe':
      for (const point of points) packed[i++] = packer.packUnsafe(point);
      break;
      // return points.map(packer.packUnsafe);
    case 'main':
      for (const point of points) packed[i++] = Point2D.pack(point);
      break;
      // return points.map(Point2D.pack);
    case 'hash':
      for (const point of points) packed[i++] = Point2D.hash(point);
      break;
      // return points.map(Point2D.hash);
    default:
      throw new Error(`unhandled pack method: ${method}`);
  }
  const time = performance.now() - started;
  return { packed, time };
};

const unpack = (method: Method, packed: number[] | bigint[], bounds: Bounds2D) => {
  const packer = Point2D.makeSmallIntPacker(bounds);
  const unpacked = new Array(packed.length);
  let i = 0;
  const started = performance.now();
  switch (method) {
    case 'smallInt':
      for (const item of packed) unpacked[i++] = packer.unpack(item as number);
      break;
      // return (packed as number[]).map(packer.unpack);
    case 'smallIntUnsafe':
      for (const item of packed) unpacked[i++] = packer.unpackUnsafe(item as number);
      break;
      // return (packed as number[]).map(packer.unpackUnsafe);
    case 'main':
      for (const item of packed) unpacked[i++] = Point2D.unpack(item as bigint);
      break;
      // return (packed as bigint[]).map(Point2D.unpack);
    default:
      return { unpacked: [], time: 0 };
  }
  const time = performance.now() - started;
  return { unpacked, time };
};

const wait = () => new Promise((resolve) => setTimeout(resolve, 100));

for (const test of tests) {
  for (const method of methods) {
    if ((method === 'smallInt' || method === 'smallIntUnsafe') && test !== 'smallInt') continue;
    for (let run = 0; run < runs; ++run) {
      try {
        const points = makePoints(test);
        const bounds = Point2D.getBounds(points);

        await wait();
        const { packed, time: packTime } = pack(method, points, bounds);

        await wait();
        const { unpacked, time: unpackTime } = unpack(method, packed, bounds);

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
  logger.info(`${method}: ${methodPass ? PASS : FAIL}`);
  Object.entries(methodData).forEach(([test, testData]) => {
    if (!testData.length) return;
    const testPass = testData.length && testData.every(({ pass }) => pass);
    logger.info(`  ${test}: ${testPass ? PASS : FAIL}`);
    for (const operation of operations) {
      const times = testData.map((item) => item[operation]).filter((item) => item !== -1);
      const [min, max] = Utils.minMax(...times).map(Utils.roundTo);
      const avg = Utils.roundTo(Utils.mean(...times));
      const throws = runs - times.length;
      logger.info(`    ${operation}`, { min, max, avg, throws });
    }
  });
});
