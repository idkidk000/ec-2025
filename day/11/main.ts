import { EcArgParser } from '@/lib/args.1.ts';
import { Logger } from '@/lib/logger.0.ts';

function part1(data: string, logger: Logger) {
  const columns = data.split('\n').map((token) => parseInt(token));
  const calcChecksum = () => columns.reduce((acc, item, i) => acc + item * (i + 1), 0);

  logger.debugLow('start', columns, calcChecksum());

  const rounds = 10;
  enum Phase {
    Right,
    Left,
  }
  let phase = Phase.Right;
  let round = 0;

  while (round < rounds) {
    let moved = false;
    for (let c = 0; c < columns.length - 1; ++c) {
      const current = columns[c];
      const other = columns[c + 1];
      if (phase === Phase.Right) {
        if (current > other) {
          --columns[c];
          ++columns[c + 1];
          moved = true;
        }
      } else {
        if (current < other) {
          ++columns[c];
          --columns[c + 1];
          moved = true;
        }
      }
    }
    logger.debugLow(phase, round, columns, calcChecksum());

    if (moved) ++round;
    else if (phase === Phase.Right) phase = Phase.Left;
    else throw new Error('unable to complete');
  }
  // 298
  logger.success('checksum', calcChecksum());
}

function part2(data: string, logger: Logger) {
  const columns = data.split('\n').map((token) => parseInt(token));
  const calcChecksum = () => columns.reduce((acc, item, i) => acc + item * (i + 1), 0);

  logger.debugLow('start', columns, calcChecksum());

  enum Phase {
    Right,
    Left,
  }
  let phase = Phase.Right;
  let round = 0;

  while (true) {
    let moved = false;
    for (let c = 0; c < columns.length - 1; ++c) {
      const current = columns[c];
      const other = columns[c + 1];
      if (phase === Phase.Right) {
        if (current > other) {
          --columns[c];
          ++columns[c + 1];
          moved = true;
        }
      } else {
        if (current < other) {
          ++columns[c];
          --columns[c + 1];
          moved = true;
        }
      }
    }
    if (round < 500 || round % 10000 === 0) logger.debugLow(phase, moved, round, columns, calcChecksum());
    if (moved) ++round;
    else if (columns.every((item) => item === columns[0])) break;
    else if (phase === Phase.Right) phase = Phase.Left;
    else throw new Error('unable to complete');
  }
  // 4025910
  logger.success('balanced after', round, 'rounds');
}

function part3(data: string, logger: Logger) {
  // this falls over horrendously if the input isn't so nicely ordered
  // TODO: generalise. maybe break columns into peaks and valleys, take the min of rounds per group using group avg, then update, regroup, and run again.
  const columns = data.split('\n').map((token) => parseInt(token));
  logger.debugLow('start', columns);

  const decreasing = columns.every((item, i, arr) => i === arr.length - 1 || item >= arr[i + 1]);
  const increasing = columns.every((item, i, arr) => i === arr.length - 1 || item <= arr[i + 1]);
  logger.debugLow({ decreasing, increasing });
  if (!increasing) throw new Error('this is hacky and requires that columns are increasing from left to right');

  const total = columns.reduce((acc, item) => acc + item, 0);
  const avg = total / columns.length;
  logger.debugLow({ total, avg });
  if (!Number.isInteger(avg)) throw new Error('avg is not an integer');

  const rounds = columns.filter((item) => item < avg).map((item) => avg - item).reduce((acc, item) => acc + item, 0);
  // 125036343957032
  logger.success('rounds', rounds);
}

function main() {
  const { data, logger, part } = new EcArgParser(import.meta.url);
  if (part === 1) part1(data, logger.makeChild('part1'));
  if (part === 2) part2(data, logger.makeChild('part2'));
  if (part === 3) part3(data, logger.makeChild('part3'));
}

main();
