import { parseArgs } from '@/lib/args.0.ts';
import { Logger } from '@/lib/logger.0.ts';

function part1(multiplier: number, logger: Logger) {
  const result = Math.floor(multiplier * 2025);
  // 11250
  logger.success('result', result);
}

function part2(multiplier: number, logger: Logger) {
  const result = Math.ceil(10000000000000 / multiplier);
  // 2193074501574
  logger.success('result', result);
}

function part3(multiplier: number, logger: Logger) {
  const result = Math.floor(multiplier * 100);
  // 281321357693
  logger.success('result', result);
}

function main() {
  const { data, logger, part } = parseArgs(import.meta.url);
  const gears = data.split('\n').map((token) => {
    const parts = token.split('|');
    return { in: parseInt(parts[0]), out: parseInt(parts.at(1) ?? parts[0]) };
  });
  const multiplier = gears.reduce((acc, item, i, arr) => {
    if (i === 0) return acc;
    const prev = arr[i - 1];
    return acc * prev.out / item.in;
  }, 1);
  logger.debugLow({ gears, multiplier });
  if (part === 1) part1(multiplier, logger.makeChild('part1'));
  if (part === 2) part2(multiplier, logger.makeChild('part2'));
  if (part === 3) part3(multiplier, logger.makeChild('part3'));
}

main();
