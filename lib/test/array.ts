// deno-lint-ignore-file no-unused-vars
import { Logger } from '@/logger.0.ts';
import { Utils } from '@/utils.0.ts';
import { Point3D, Point3DLike } from '@/point3d.0.ts';

const logger = new Logger(import.meta.url);
const tests = [
  // 'shift', 'pop',
  // 'some',
  // 'every',
  // 'iterSome',
  // 'iterEvery',
  'sort',
  'toSorted',
] as const;
type Test = (typeof tests)[number];

const results: Record<Test, number>[] = [];

const iterEvery = <T>(array: T[], callback: (value: T) => boolean) => {
  for (const item of array) if (!callback(item)) return false;
  return true;
};

const iterSome = <T>(array: T[], callback: (value: T) => boolean) => {
  for (const item of array) if (callback(item)) return true;
  return false;
};

const comparator = (a: Point3DLike, b: Point3DLike) => a.x - b.x || a.y - b.y || a.z - b.z;

const makeArray = (): Point3DLike[] => Array.from({ length: 10_000_000 }, () => ({ x: Math.random(), y: Math.random(), z: Math.random() }));
for (let run = 0; run < 100; ++run) {
  // const shiftArray = makeArray();
  // const shiftStart = performance.now();
  // while (shiftArray.length) shiftArray.shift();
  // const shiftTime = performance.now() - shiftStart;

  // const popArray = makeArray();
  // const popStart = performance.now();
  // while (popArray.length) popArray.pop();
  // const popTime = performance.now() - popStart;

  const array = makeArray();

  // const everyStart = performance.now();
  // array.every((item) => Point3D.hash(item) > 0);
  // const everyTime = performance.now() - everyStart;

  // const someStart = performance.now();
  // array.some((item) => Point3D.hash(item) > 0);
  // const someTime = performance.now() - someStart;

  // const iterEveryStart = performance.now();
  // iterEvery(array, (item) => Point3D.hash(item) > 0);
  // const iterEveryTime = performance.now() - iterEveryStart;

  // const iterSomeStart = performance.now();
  // iterSome(array, (item) => Point3D.hash(item) > 0);
  // const iterSomeTime = performance.now() - iterSomeStart;

  const toSortedStart = performance.now();
  array.toSorted(comparator);
  const toSortedTime = performance.now() - toSortedStart;
  const sortStart = performance.now();
  array.sort(comparator);
  const sortTime = performance.now() - sortStart;

  results.push({
    //  pop: popTime * 1000, shift: shiftTime * 1000,
    // every: everyTime * 1000,
    // iterEvery: iterEveryTime * 1000,
    // iterSome: iterSomeTime * 1000,
    // some: someTime * 1000,
    sort: sortTime,
    toSorted: toSortedTime,
  });

  for (const test of tests) {
    const times = results.map((item) => item[test]);
    const [min, max] = Utils.minMax(...times).map(Utils.roundTo);
    const avg = Utils.roundTo(Utils.mean(...times));

    logger.success(test, run, { min, max, avg });
  }
}
