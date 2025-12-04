import { EcArgParser } from '@/lib/args.1.ts';
import { Logger } from '@/lib/logger.0.ts';

enum Phase {
  Right,
  Left,
}

function checksum(columns: number[]) {
  return columns.reduce((acc, item, i) => acc + item * (i + 1), 0);
}

function simulate(columns: number[], exitCondition: number | 'balanced', logger: Logger): number {
  let phase = Phase.Right;
  let round = 0;
  while (true) {
    let moved = false;
    for (let c = 0; c < columns.length - 1; ++c) {
      if (phase === Phase.Right && columns[c] > columns[c + 1]) {
        --columns[c];
        ++columns[c + 1];
        moved = true;
      } else if (phase === Phase.Left && columns[c] < columns[c + 1]) {
        ++columns[c];
        --columns[c + 1];
        moved = true;
      }
    }
    if (round < 500 || round % 10000 === 0) logger.debugLow(phase, moved, round, columns, checksum(columns));
    if (moved) ++round;
    else if (phase === Phase.Right) phase = Phase.Left;
    else if (exitCondition === 'balanced' && columns.every((item) => item === columns[0])) break;
    else throw new Error('unable to complete');
    if (typeof exitCondition === 'number' && round === exitCondition) break;
  }
  return round;
}

function part1(columns: number[], logger: Logger) {
  simulate(columns, 10, logger);
  // 298
  logger.success('checksum', checksum(columns));
}

function part2(columns: number[], logger: Logger) {
  const rounds = simulate(columns, 'balanced', logger);
  // 4025910
  logger.success('rounds', rounds);
}

function part3(columns: number[], logger: Logger) {
  // this falls over horrendously if the input isn't so nicely ordered
  // TODO: generalise. maybe break columns into peaks and valleys, take the min of rounds per group using min(group avg,next col) then update, regroup, and run again.
  const decreasing = columns.every((item, i, arr) => i === arr.length - 1 || item >= arr[i + 1]);
  const increasing = columns.every((item, i, arr) => i === arr.length - 1 || item <= arr[i + 1]);
  logger.debugLow({ decreasing, increasing });
  if (!(increasing || decreasing)) throw new Error('this is hacky and requires that columns are increasing or decreasing from left to right');

  const total = columns.reduce((acc, item) => acc + item, 0);
  const avg = total / columns.length;
  logger.debugLow({ total, avg });
  if (!Number.isInteger(avg)) throw new Error('avg is not an integer');

  const rounds = columns.filter((item) => item < avg).map((item) => avg - item).reduce((acc, item) => acc + item, 0);
  // 125036343957032
  logger.success('rounds', rounds);
}

/** there is no part4, this is a fast general solution
 *
 * based on https://github.com/p88h/everybody.codes/blob/main/src/e2025/q11.rs because i couldn't get the grouping logic right
 */
function part4(columns: number[], logger: Logger) {
  const groups: { avg: number; count: number }[] = [];
  let c = 0;
  while (c < columns.length) {
    let to = c;
    let sum = columns[to];
    // extend forward while next value <= current
    while (to < columns.length - 1 && columns[to + 1] <= columns[to]) {
      ++to;
      sum += columns[to];
    }
    let count = to - c + 1;
    // merge group backward while prev avg >= current
    while (groups.length && groups[groups.length - 1].avg >= Math.floor(sum / count)) {
      const prev = groups.pop();
      if (!prev) continue;
      count += prev.count;
      sum += prev.avg * prev.count;
    }
    const avg = Math.floor(sum / count);
    const remainder = sum % count;
    logger.debugLow({ c, to, sum, count, avg, remainder });
    // push to groups but remove remainder from length
    groups.push({ avg, count: count - remainder });
    // push an extra group for the remainder
    if (remainder) groups.push({ avg: avg + 1, count: remainder });
    c = to + 1;
  }

  // logger.debugLow(groups, groups.length);

  // expand groups out to the next state after right phase
  const nextColumns = groups.flatMap((group) => new Array<number>(group.count).fill(group.avg));
  logger.debugMed({ nextColumns });

  let rightRounds = 0;
  let overflow = 0;
  // right phase is sum of prev overflow + old state - next state
  for (let i = 0; i < nextColumns.length; ++i) {
    const rounds = columns[i] - nextColumns[i] + overflow;
    rightRounds = Math.max(rightRounds, rounds);
    logger.debugMed('right', { i, value: columns[i], next: nextColumns[i], overflow, rounds, rightRounds });
    overflow = rounds;
  }

  if (overflow !== 0) throw new Error(`${overflow} overflow after right phase`);

  // left phase is sum of the differences between nextColumns and avg where nextColumn < avg
  const avg = Math.floor(nextColumns.reduce((acc, item) => acc + item, 0) / nextColumns.length);
  logger.debugMed({ avg });
  const leftRounds = nextColumns.filter((item) => item < avg).map((item) => avg - item).reduce((acc, item) => acc + item, 0);

  const totalRounds = rightRounds + leftRounds;

  logger.success(totalRounds);
}

function main() {
  const { data, logger, part } = new EcArgParser(import.meta.url);
  const columns = data.split('\n').map((token) => parseInt(token));
  logger.debugLow('start', columns, checksum(columns));
  if (part === 1) part1(columns, logger.makeChild('part1'));
  if (part === 2) part2(columns, logger.makeChild('part2'));
  if (part === 3) part3(columns, logger.makeChild('part3'));
  if (part === 4) part4(columns, logger.makeChild('part4'));
}

main();
