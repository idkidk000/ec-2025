import { BinaryHeap } from '@/binary-heap.0.ts';
import { ansiStyles, Logger } from '@/logger.0.ts';
import { Utils } from '@/utils.0.ts';

const logger = new Logger(import.meta.url);
const comparator = (a: number, b: number) => a - b;
const [runs, length] = Deno.args.includes('-vfast') ? [1, 1000] : Deno.args.includes('-fast') ? [10, 100_000] : [10, 10_000_000];

const tests = ['array', 'arraySome', 'heap', 'heapSome', 'set'] as const;
type Test = (typeof tests)[number];

const results: Record<Test, { construct: number; has: number; pass: boolean }[]> = {
  array: [],
  arraySome: [],
  heap: [],
  heapSome: [],
  set: [],
};

const wait = () => new Promise((resolve) => setTimeout(resolve, 100));

for (let run = 0; run < runs; ++run) {
  const search = Math.random();
  const source = Array.from({ length }, Math.random);
  if (run % 2) source.push(search);

  await wait();

  let array: number[];
  let heap: BinaryHeap<number>;
  let set: Set<number>;

  for (const test of tests) {
    await wait();
    const constructorStarted = performance.now();
    if (test === 'array') array = [...source];
    else if (test === 'heap') heap = new BinaryHeap(comparator, source);
    else if (test === 'set') set = new Set(source);
    const constructorTime = performance.now() - constructorStarted;

    await wait();
    let has: boolean;
    const hasStarted = performance.now();
    // @ts-expect-error shush
    if (test === 'array') has = array.includes(search);
    // @ts-expect-error shush
    else if (test === 'arraySome') has = array.some((value) => value === search);
    // @ts-expect-error shush
    else if (test === 'heap') has = heap.includes(search);
    // @ts-expect-error shush
    else if (test === 'heapSome') has = heap.some((value) => value === search);
    // @ts-expect-error shush
    else if (test === 'set') has = set.has(search);
    else throw new Error(`unhandled test ${test}`);
    const hasTime = performance.now() - hasStarted;

    const pass = run % 2 ? has : !has;

    logger.info({ run, test, constructorTime, hasTime, pass });
    results[test].push({ construct: constructorTime, has: hasTime, pass });
  }
}

for (const [test, data] of Object.entries(results)) {
  const rate = data.filter(({ pass }) => pass).length / (data.length || 1);
  const pass = rate === 1;
  logger.info(
    ansiStyles.bold,
    test,
    pass ? ansiStyles.fgIntense.green : ansiStyles.fgIntense.red,
    pass ? 'PASS' : 'FAIL',
    `${rate > 0 && rate < 1 ? ansiStyles.fgIntense.yellow : ''}${Utils.roundTo(rate * 100)}%`,
    ansiStyles.reset,
  );
  for (const method of ['construct', 'has'] as const) {
    const times = data.map((item) => item[method]);
    const [min, max] = Utils.minMax(...times).map(Utils.roundTo);
    const avg = Utils.roundTo(Utils.mean(...times));
    logger.info('  ', method.padEnd(10, ' '), { min, max, avg });
  }
}
