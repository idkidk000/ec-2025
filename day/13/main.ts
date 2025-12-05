import { EcArgParser } from '@/lib/args.1.ts';
import { Logger } from '@/lib/logger.0.ts';

function part1(data: string, logger: Logger) {
  const values = data.split('\n').map((line) => parseInt(line));
  const arr = new Array(values.length + 1);
  arr[0] = 1;
  for (const [i, value] of values.entries()) {
    const half = Math.floor(i / 2);
    const ix = i % 2 === 0 ? half + 1 : arr.length - half - 1;
    logger.debugMed({ i, half, ix, value });
    arr[ix] = value;
  }
  logger.debugLow(arr);
  // 945
  logger.success(arr[2025 % arr.length]);
}

function part2(data: string, logger: Logger) {
  const ranges = data.split('\n').map((line) => {
    const parts = line.split('-');
    return { from: parseInt(parts[0]), to: parseInt(parts[1]) };
  });
  const count = ranges.map(({ from, to }) => to - from + 1).reduce((acc, item) => acc + item, 0);
  logger.debugLow(ranges, count);

  const items = new Array<number>(count + 1);
  items[0] = 1;

  let right = 1;
  let left = items.length - 1;
  for (const [r, range] of ranges.entries()) {
    for (let i = range.from; i <= range.to; ++i) {
      if (r % 2 === 0) items[right++] = i;
      else items[left--] = i;
    }
  }
  logger.debugLow(items);

  // 9907
  logger.success(items[20252025 % items.length]);
}

function part3(data: string, logger: Logger) {
  const ranges = data.split('\n').map((line) => {
    const parts = line.split('-');
    return { from: parseInt(parts[0]), to: parseInt(parts[1]) };
  });
  const count = ranges.map(({ from, to }) => to - from + 1).reduce((acc, item) => acc + item, 0);
  logger.debugLow(ranges, count);

  const sorted = new Array<{ from: number; to: number }>(ranges.length + 1);
  sorted[0] = { from: 1, to: 1 };
  let right = 1;
  let left = sorted.length - 1;
  for (const [r, range] of ranges.entries()) {
    if (r % 2 === 0) sorted[right++] = range;
    else sorted[left--] = { from: range.to, to: range.from };
  }
  logger.debugMed(sorted);

  // +1 for the {from:1,to:1}
  let remain = 202520252025 % (count + 1);
  logger.debugLow(remain);

  let result: number | null = null;
  for (const range of sorted) {
    const length = Math.abs(range.to - range.from) + 1;
    logger.debugLow({ remain, range, length });
    if (remain > length) remain -= length;
    else {
      result = range.from + (range.from < range.to ? remain : -remain);
      break;
    }
  }
  // 363609
  logger.success(result);
}

function main() {
  const { data, logger, part } = new EcArgParser(import.meta.url);
  if (part === 1) part1(data, logger.makeChild('part1'));
  if (part === 2) part2(data, logger.makeChild('part2'));
  if (part === 3) part3(data, logger.makeChild('part3'));
}

main();
