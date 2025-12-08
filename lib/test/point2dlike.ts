import { Logger } from '@/logger.0.ts';
import { Utils } from '@/utils.0.ts';
import { Point2D, Point2DLike } from '@/point2d.0.ts';

const logger = new Logger(import.meta.url);

const length = Deno.args.includes('-vfast') ? 1_000 : Deno.args.includes('-fast') ? 1_000_000 : 10_000_000;

const tests = ['class', 'type'] as const;
type Test = (typeof tests)[number];
const results: Record<Test, number[]> = {
  class: [],
  type: [],
};

for (let run = 0; run < 10; ++run) {
  const classStarted = performance.now();
  const [classLeft, classRight] = [
    Array.from({ length }, () => new Point2D(1, 1)),
    Array.from({ length }, () => new Point2D(1, 1)),
  ];
  classLeft.map((item, i) => item.add(classRight[i]));
  const classTime = performance.now() - classStarted;

  const typeStarted = performance.now();
  const [typeLeft, typeRight] = [
    Array.from({ length }, () => ({ x: 1, y: 1 }) satisfies Point2DLike),
    Array.from({ length }, () => ({ x: 1, y: 1 }) satisfies Point2DLike),
  ];
  typeLeft.map((item, i) => Point2D.add(item, typeRight[i]));
  const typeTime = performance.now() - typeStarted;

  logger.info({ run, length, classTime, typeTime });
  results.class.push(classTime);
  results.type.push(typeTime);
}

for (const test of tests) {
  const times = results[test];
  const [min, max] = Utils.minMax(...times).map(Utils.roundTo);
  const avg = Utils.roundTo(Utils.mean(...times));
  logger.info(test, { min, max, avg });
}
