import { EcArgParser } from '@/lib/args.1.ts';
import { Logger } from '@/lib/logger.0.ts';
import { Utils } from '../../lib/utils.0.ts';

function part1(spell: number[], logger: Logger) {
  const total = spell.map((item) => Math.floor(90 / item)).reduce((acc, item) => acc + item, 0);
  // 262
  logger.success(total);
}

function calcSpell(heights: number[], logger: Logger): Set<number> {
  const spell = new Set<number>();
  for (let i = 1; i <= heights.length; ++i) {
    const height = heights[i - 1];
    logger.debugMed({ i, height, spell });
    if (height === 0) continue;
    let remain = height;
    for (const item of spell) if (i % item === 0) --remain;
    logger.debugHigh({ remain });
    if (remain === 0) continue;
    else if (remain === 1) spell.add(i);
    else throw new Error('oh no');
  }
  logger.debugLow({ spell });
  return spell;
}

function part2(heights: number[], logger: Logger) {
  const result = calcSpell(heights, logger).keys().reduce((acc, item) => acc * item, 1);
  // 146305564416
  logger.success(result);
}

function _part3V1(heights: number[], logger: Logger) {
  const blocks = 202520252025000;
  // const blocks = 1000;
  const spell = calcSpell(heights, logger);
  /** BUG: **HUGE** number in `part3.txt`*/
  const lcm = Utils.lcm(...spell);
  if (lcm > blocks) throw new Error('oh no');
  const blocksPerLcm = spell.keys().map((item) => Math.floor(lcm / item)).reduce((acc, item) => acc + item, 0);
  const totalLcmSections = Math.floor(blocks / blocksPerLcm);
  const totalLcmColumns = totalLcmSections * lcm;
  let blocksRemain = blocks % blocksPerLcm;
  let remainColumns = 0;
  logger.debugLow({ lcm, blocksPerLcm, totalLcmSections, totalLcmColumns, blocksRemain });
  for (let i = 1; blocksRemain > 0; ++i) {
    const columnBlocks = spell.keys().filter((item) => i % item === 0).reduce((acc) => ++acc, 0);
    if (columnBlocks <= blocksRemain) {
      blocksRemain -= columnBlocks;
      ++remainColumns;
    } else { break; }
  }
  logger.debugLow({ remainColumns, blocksRemain });
  const totalColumns = totalLcmColumns + remainColumns;
  logger.success(totalColumns);
}

function part3(heights: number[], logger: Logger) {
  const totalBlocks = 202520252025000;
  // const totalBlocks = 1000;
  const shush = logger.makeChild('spell');
  shush.setLevel('Error');
  const spell = calcSpell(heights, shush);

  function calcBlocks(columns: number): number {
    return spell.keys().map((item) => Math.floor(columns / item)).reduce((acc, item) => acc + item, 0);
  }

  let upper = totalBlocks;
  let lower = 0;

  while (lower < upper) {
    const mid = lower + Math.ceil((upper - lower) / 2);
    const blocksUsed = calcBlocks(mid);
    logger.debugLow({ lower, upper, mid, blocksUsed });
    if (blocksUsed > totalBlocks) upper = mid - 1;
    //not +1 bc there might be a remainder
    else if (blocksUsed < totalBlocks) lower = mid;
  }

  // 97761783138081
  logger.info(lower);
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
