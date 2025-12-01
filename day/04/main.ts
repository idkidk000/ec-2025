import { parseArgs } from '@/lib/args.0.ts';
import { Logger } from '@/lib/logger.0.ts';

function part1(data: string, logger: Logger) {
  const gears = data.split('\n').map((token) => parseInt(token));
  const lastTurnsPerFirstTurn = gears.reduce((acc, item, i, arr) => {
    if (i === 0) return acc;
    const prev = arr[i - 1];
    return acc * prev / item;
  }, 1);
  logger.debugLow({ lastTurnsPerFirstTurn });
  const result = Math.floor(lastTurnsPerFirstTurn * 2025);
  // 11250
  logger.success('result', result);
}

function part2(data: string, logger: Logger) {
  const gears = data.split('\n').map((token) => parseInt(token));
  const lastTurnsPerFirstTurn = gears.reduce((acc, item, i, arr) => {
    if (i === 0) return acc;
    const prev = arr[i - 1];
    return acc * prev / item;
  }, 1);
  logger.debugLow({ lastTurnsPerFirstTurn });
  const result = Math.ceil(10000000000000 / lastTurnsPerFirstTurn);
  // 2193074501574
  logger.success('result', result);
}

function part3(data: string, logger: Logger) {
  type Gear = { in: number; out: number };
  const gears: Gear[] = data.split('\n').map((token) => {
    const parts = token.split('|');
    return { in: parseInt(parts[0]), out: parseInt(parts.at(1) ?? parts[0]) };
  });
  const lastTurnsPerFirstTurn = gears.reduce((acc, item, i, arr) => {
    if (i === 0) return acc;
    const prev = arr[i - 1];
    return acc * prev.out / item.in;
  }, 1);
  logger.debugLow({ lastTurnsPerFirstTurn });
  const result = Math.floor(lastTurnsPerFirstTurn * 100);
  // 281321357693
  logger.success('result', result);
}

function main() {
  const { data, logger, part } = parseArgs(import.meta.url);
  if (part === 1) part1(data, logger.makeChild('part1'));
  if (part === 2) part2(data, logger.makeChild('part2'));
  if (part === 3) part3(data, logger.makeChild('part3'));
}

main();
