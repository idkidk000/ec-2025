import { ansiStyles, Logger } from '@/logger.0.ts';
import { Utils } from '@/utils.0.ts';

const tests = ['mod', 'trunc', 'shift'] as const;
type Test = (typeof tests)[number];
const results: Record<Test, number[]> = {
  mod: [],
  trunc: [],
  shift: [],
};
const [runs, length] = Deno.args.includes('-vfast') ? [1, 1000] : Deno.args.includes('-fast') ? [10, 1_000_000] : [10, 10_000_000];
const logger = new Logger(import.meta.url);

const wait = () => new Promise((resolve) => setTimeout(resolve, 100));

for (let run = 0; run < runs; ++run) {
  const input = Array.from({ length }, Math.random);
  for (const test of tests) {
    const output = new Array<number>(length);
    let i = 0;
    await wait();
    const started = performance.now();
    // v % 1 is slower and loses precision
    if (test === 'mod') {
      for (const item of input) output[i++] = item % 1;
    } else if (test === 'trunc') {
      for (const item of input) {
        const int = Math.trunc(item);
        output[i++] = item - int;
      }
    } else if (test === 'shift') {
      for (const item of input) {
        const int = item << 0;
        output[i++] = item - int;
      }
    } else { throw new Error(`unhandled test ${test}`); }

    const time = performance.now() - started;
    logger.debugLow({ run, test }, time);
    results[test].push(time);
  }
}

for (const test of tests) {
  const times = results[test];
  const [min, max] = Utils.minMax(...times).map(Utils.roundTo);
  const avg = Utils.roundTo(Utils.mean(...times));
  logger.info(ansiStyles.bold, test, ansiStyles.reset);
  logger.info('  ', { min, max, avg });
}
