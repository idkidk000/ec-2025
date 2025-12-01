import { parseArgs } from '@/lib/args.0.ts';
import { Logger } from '@/lib/logger.0.ts';
import { Utils } from '@/lib/utils.0.ts';

function part1(names: string[], operations: number[], logger: Logger) {
  let i = 0;
  for (const operation of operations) {
    i = Utils.clamp(i + operation, 0, names.length - 1);
    logger.debugLow(i, names[i]);
  }
  // Ryththyris
  logger.success(names[i]);
}

function part2(names: string[], operations: number[], logger: Logger) {
  let i = 0;
  for (const operation of operations) {
    i = Utils.modP(i + operation, names.length);
    logger.debugLow(i, names[i]);
  }
  // Jorathphor
  logger.success(names[i]);
}

function part3(names: string[], operations: number[], logger: Logger) {
  for (const operation of operations) {
    const i = Utils.modP(operation, names.length);
    logger.debugLow({ operation, i }, names[0], names[i]);
    [names[0], names[i]] = [names[i], names[0]];
  }
  // Draithulth
  logger.success(names[0]);
}

function main() {
  const { data, logger, part } = parseArgs(import.meta.url);
  const [names, moves] = data.split('\n\n').map((line) => line.split(','));
  const operations = moves.map((token) => parseInt(token.slice(1)) * (token.slice(0, 1) === 'L' ? -1 : 1));
  logger.debugLow(names, operations);
  if (part === 1) part1(names, operations, logger.makeChild('part1'));
  if (part === 2) part2(names, operations, logger.makeChild('part2'));
  if (part === 3) part3(names, operations, logger.makeChild('part3'));
}

main();
