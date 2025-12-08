import { Logger } from '@/logger.0.ts';
import { SortedQueue } from '@/lib/sorted-queue.0.ts';
import { BinaryHeap } from '@/binary-heap.0.ts';
import { Utils } from '@/utils.0.ts';

const logger = new Logger(import.meta.url);
const results: Record<'queue' | 'heap', { writes: number[]; reads: number[]; invalid: number }> = {
  heap: { invalid: 0, writes: [], reads: [] },
  queue: { invalid: 0, writes: [], reads: [] },
};

const sorter = (a: number, b: number) => a - b;

for (let run = 0; run < 10; ++run) {
  const sources = Array.from({ length: 10_000 }, () => Array.from({ length: 10 }, () => Math.round(Math.random() * 10_000)));

  // queue
  const queue = new SortedQueue(sorter);
  const queueOut: number[] = [];

  const queueWriteStarted = performance.now();
  for (const source of sources) queue.push(...source);
  const queueWriteTime = performance.now() - queueWriteStarted;

  const queueReadStarted = performance.now();
  // deno-lint-ignore no-non-null-assertion
  while (queue.length) queueOut.push(queue.pop()!);
  const queueReadTime = performance.now() - queueReadStarted;

  const queueOutSorted = queueOut.toSorted(sorter);
  const queueValid = (() => {
    for (const [i, item] of queueOut.entries())
      if (queueOutSorted[i] !== item) return false;
    return true;
  })();

  logger[queueValid ? 'success' : 'error']('queue', { run, queueValid, queueWriteTime, queueReadTime });
  results.queue.reads.push(queueReadTime);
  results.queue.writes.push(queueWriteTime);
  if (!queueValid) ++results.queue.invalid;

  // heap
  const heap = new BinaryHeap(sorter);
  const heapOut: number[] = [];

  const heapWriteStarted = performance.now();
  for (const source of sources) heap.push(...source);
  const heapWriteTime = performance.now() - heapWriteStarted;

  const heapReadStarted = performance.now();
  // deno-lint-ignore no-non-null-assertion
  while (heap.length) heapOut.push(heap.pop()!);
  const heapReadTime = performance.now() - heapReadStarted;

  const heapOutSorted = heapOut.toSorted(sorter);
  const heapValid = (() => {
    for (const [i, item] of heapOut.entries())
      if (heapOutSorted[i] !== item) return false;
    return true;
  })();

  logger[heapValid ? 'success' : 'error']('heapHas', { run, heapValid, heapWriteTime, heapReadTime });
  results.heap.reads.push(heapReadTime);
  results.heap.writes.push(heapWriteTime);
  if (!heapValid) ++results.heap.invalid;
}

Object.entries(results).forEach(([key, data]) => {
  logger[data.invalid ? 'error' : 'success'](key, { invalid: data.invalid });
  for (const test of ['writes', 'reads'] as const) {
    const times = data[test];
    const [min, max] = Utils.minMax(...times).map(Utils.roundTo);
    const avg = Utils.roundTo(Utils.mean(...times));
    logger.info(test, { min, max, avg });
  }
});
