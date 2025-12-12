import { EcArgParser } from '@/lib/args.1.ts';
import { Logger } from '@/lib/logger.0.ts';

function calcBlocksUsed(spell: number[], columns: number): number {
  return spell.map((item) => Math.floor(columns / item)).reduce((acc, item) => acc + item, 0);
}

function calcSpell(heights: number[], logger: Logger): number[] {
  const spell: number[] = [];
  for (let i = 1; i <= heights.length; ++i) {
    let height = heights[i - 1];
    logger.debugMed({ i, height, spell });
    for (const item of spell) if (i % item === 0) --height;
    logger.debugHigh({ height });
    if (height === 0) continue;
    else if (height === 1) spell.push(i);
    else throw new Error('oh no');
  }
  logger.debugLow({ spell });
  return spell;
}

function part1(spell: number[], logger: Logger) {
  const total = calcBlocksUsed(spell, 90);
  // 262
  logger.success(total);
}

function part2(heights: number[], logger: Logger) {
  const result = calcSpell(heights, logger).reduce((acc, item) => acc * item, 1);
  // 146305564416
  logger.success(result);
}

function part3(heights: number[], logger: Logger) {
  const totalBlocks = 202520252025000;
  const spell = calcSpell(heights, logger);

  let upper = totalBlocks;
  let lower = 0;

  while (lower < upper) {
    const mid = lower + Math.ceil((upper - lower) / 2);
    const blocksUsed = calcBlocksUsed(spell, mid);
    logger.debugLow({ upper, lower, mid, blocksUsed });
    // definitely too high
    if (blocksUsed > totalBlocks) upper = mid - 1;
    // remainder is ok
    else lower = mid;
  }

  // 97761783138081
  logger.success(lower);
}

function main() {
  const { data, logger, part } = new EcArgParser(import.meta.url);
  const values = data.split(',').map((token) => parseInt(token));
  logger.debugHigh({ values });
  if (part === 1) part1(values, logger.makeChild('part1'));
  if (part === 2) part2(values, logger.makeChild('part2'));
  if (part === 3) part3(values, logger.makeChild('part3'));
}

main();
