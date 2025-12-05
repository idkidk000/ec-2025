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

  //FIXME: range is only part of this array to help debug part 3
  const arr = new Array<{ value: number; from: number; to: number }>(count + 1);
  arr[0] = { from: 1, to: 1, value: 1 };

  let right = 1;
  let left = arr.length - 1;

  for (const [r, range] of ranges.entries()) {
    for (let i = range.from; i <= range.to; ++i) {
      if (r % 2 === 0) arr[right++] = { ...range, value: i };
      else arr[left--] = { ...range, value: i };
    }
  }

  logger.debugLow(arr);
  // 9907
  logger.success(arr[20252025 % arr.length]);
}

function part3(data: string, logger: Logger) {
  const ranges = data.split('\n').map((line) => {
    const parts = line.split('-');
    return { from: parseInt(parts[0]), to: parseInt(parts[1]) };
  });
  const count = ranges.map(({ from, to }) => to - from + 1).reduce((acc, item) => acc + item, 0);
  logger.debugLow(ranges, count);

  const arr = new Array<{ from: number; to: number }>(ranges.length + 1);
  arr[0] = { from: 1, to: 1 };
  let right = 1;
  let left = arr.length - 1;
  for (const [r, range] of ranges.entries()) {
    if (r % 2 === 0) arr[right++] = range;
    else arr[left--] = { from: range.to, to: range.from };
  }
  logger.info(arr);

  let remain = 202520252025 % (count + 1);
  // +1 for the {from:1,to:1}
  // let remain = 20252025 % (count + 1);
  logger.debugLow(remain);

  for (const range of arr) {
    const length = Math.abs(range.to - range.from) + 1;
    logger.debugLow({ remain, range, length });
    if (remain > length) remain -= length;
    else {
      const final = range.from < range.to ? range.from + remain : range.from - remain;
      logger.info({ range, remain });
      // 363609
      logger.success('final', final);
      break;
    }
  }
}

function main() {
  const { data, logger, part } = new EcArgParser(import.meta.url);
  if (part === 1) part1(data, logger.makeChild('part1'));
  if (part === 2) part2(data, logger.makeChild('part2'));
  if (part === 3) part3(data, logger.makeChild('part3'));
}

main();
