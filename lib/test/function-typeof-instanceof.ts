import { Logger } from '@/logger.0.ts';
import { Utils } from '@/utils.0.ts';

const iters = 100_000_000;
const runs = 10;

const logger = new Logger(import.meta.url);
const items = [
  (a: number, b: number) => Math.sqrt(a ** 2 + b ** 2),
  (i: number) => i % 10,
  Math.random,
  5,
  'xyz',
];
const tests = ['typeof', 'instanceof'] as const;
type Test = (typeof tests)[number];
const results: Record<Test, number>[] = [];

for (let run = 0; run < runs; ++run) {
  let typeofCount = 0;
  const typeOfStart = performance.now();
  for (let i = 0; i < iters; ++i) for (const item of items) if (typeof item === 'function') ++typeofCount;
  const typeOfTime = performance.now() - typeOfStart;

  let instanceOfCount = 0;
  const instanceOfStart = performance.now();
  for (let i = 0; i < iters; ++i) for (const fn of items) if (fn instanceof Function) ++instanceOfCount;
  const instanceOfTime = performance.now() - instanceOfStart;

  results.push({ instanceof: instanceOfTime, typeof: typeOfTime });
  logger.debugLow({ run, typeOfTime, instanceOfTime });
}

for (const test of tests) {
  const times = results.map((item) => item[test]);
  const [min, max] = Utils.minMax(...times).map(Utils.roundTo);
  const avg = Utils.roundTo(Utils.mean(...times));
  logger.success(test, { min, max, avg });
}
