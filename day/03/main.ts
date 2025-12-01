import { parseArgs } from '@/lib/args.0.ts';
import { Logger } from '@/lib/logger.0.ts';
import { Utils } from '@/lib/utils.0.ts';

function part1(crates: number[], logger: Logger) {
  const set = new Set(crates);
  const sum = Utils.sum(...set);
  // 2582
  logger.success('result', sum);
}

function part2(crates: number[], logger: Logger) {
  const set = new Set(crates);
  const smallest20 = [...set].toSorted((a, b) => a - b).slice(0, 20).toReversed();
  logger.debugLow('smallest20', smallest20);
  const sum = Utils.sum(...smallest20);
  // 310
  logger.success('result', sum);
}

function part3(crates: number[], logger: Logger) {
  const sets: Set<number>[] = [];
  for (const crate of crates) {
    let found = false;
    for (const set of sets) {
      if (!set.has(crate)) {
        set.add(crate);
        found = true;
        break;
      }
    }
    if (!found) sets.push(new Set([crate]));
  }
  logger.debugLow(sets);
  // 4376
  logger.success('result', sets.length);
}

function main() {
  const { data, logger, part } = parseArgs(import.meta.url);
  const crates = data.split(',').map((token) => parseInt(token));
  logger.debugMed({ data, crates });
  if (part === 1) part1(crates, logger.makeChild('part1'));
  if (part === 2) part2(crates, logger.makeChild('part2'));
  if (part === 3) part3(crates, logger.makeChild('part3'));
}

main();
