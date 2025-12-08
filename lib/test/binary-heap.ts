import { BinaryHeap } from '@/binary-heap.0.ts';
import { ansiStyles, Logger } from '@/logger.0.ts';
import { Utils } from '@/utils.0.ts';

const logger = new Logger(import.meta.url);
const comparator = (a: number, b: number) => a - b;
const runs = 10;
const length = Deno.args.includes('-fast') ? 10_000 : 1_000_000;

const results: { read: number; write: number; pass: boolean }[] = [];

for (let run = 0; run < runs; ++run) {
  const input = Array.from({ length }, () => Math.round((Math.random() - 0.5) * 2 * Number.MAX_SAFE_INTEGER));
  // const writeHeap = new BinaryHeap(sorter);

  const writeStarted = performance.now();
  const writeHeap = new BinaryHeap(comparator, input);
  // for (const item of input) writeHeap.push(item);
  const writeTime = performance.now() - writeStarted;

  const readStarted = performance.now();
  // discard the output since we only want to bench the heap, not Array.push()
  while (writeHeap.length) writeHeap.pop();
  const readTime = performance.now() - readStarted;

  // start over with a fresh instance to test that output is correctly ordered
  const readHeap = new BinaryHeap(comparator);
  for (const item of input) readHeap.push(item);
  const output: number[] = [];
  // deno-lint-ignore no-non-null-assertion
  while (readHeap.length) output.push(readHeap.pop()!);
  const sorted = input.toSorted(comparator);
  const pass = output.length === sorted.length && output.every((item, i) => sorted[i] === item);
  logger.debugLow({ writeTime, readTime, pass });
  results.push({ read: readTime, pass, write: writeTime });
}

const pass = results.length && results.every(({ pass }) => pass);
logger.info(
  pass ? `${ansiStyles.bold}${ansiStyles.fgIntense.green}PASS${ansiStyles.reset}` : `${ansiStyles.bold}${ansiStyles.fgIntense.red}FAIL${ansiStyles.reset}`,
);
for (const operation of ['write', 'read'] as const) {
  const times = results.map((result) => result[operation]);
  const [min, max] = Utils.minMax(...times).map(Utils.roundTo);
  const avg = Utils.roundTo(Utils.mean(...times));
  logger.info(`  ${operation}`, { min, max, avg });
}
