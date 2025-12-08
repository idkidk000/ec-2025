import { Offset2D, Point2D } from '@/point2d.0.ts';
import { Logger } from '@/logger.0.ts';
import { Utils } from '@/utils.0.ts';

const size = 100;
const radius = 25;
const runs = 10;
const tests = ['iter', 'loop'] as const;
type Test = (typeof tests)[number];
const results: Record<Test, number>[] = [];
const logger = new Logger(import.meta.url);

for (let run = 0; run < runs; ++run) {
  const iterStarted = performance.now();
  for (let x = -size; x < size; ++x) {
    for (let y = -size; y < size; ++y) {
      const _neighbours = Point2D.neighbours({ x, y }, radius, Offset2D.Cardinal);
    }
  }
  const iterTime = performance.now() - iterStarted;

  const loopStarted = performance.now();
  for (let x = -size; x < size; ++x) {
    for (let y = -size; y < size; ++y) {
      const neighbours = new Array(radius * 4);
      let ii = 0;
      for (let i = 0; i <= radius; ++i) {
        neighbours[ii++] = { x, y: y - i };
        neighbours[ii++] = { x: x + i, y };
        neighbours[ii++] = { x, y: y + i };
        neighbours[ii++] = { x: x - i, y };
      }
    }
  }
  const loopTime = performance.now() - loopStarted;

  results.push({ iter: iterTime, loop: loopTime });
  logger.debugLow({ run, iterTime, loopTime });
}

for (const test of tests) {
  const times = results.map((item) => item[test]);
  const [min, max] = Utils.minMax(...times).map(Utils.roundTo);
  const avg = Utils.roundTo(Utils.mean(...times));
  logger.success(test, { min, max, avg });
}
