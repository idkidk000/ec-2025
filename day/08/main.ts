import { EcArgParser } from '@/lib/args.1.ts';
import { Logger } from '@/lib/logger.0.ts';

interface Line {
  from: number;
  to: number;
}

function part1(lines: Line[], nails: number, logger: Logger) {
  const total = lines.reduce((acc, line) => {
    const center = Math.abs(line.from - line.to) === nails / 2;
    if (center) {
      logger.debugMed('center', line);
      return acc + 1;
    }
    return acc;
  }, 0);
  // 63
  logger.success('total', total);
}

function part2(lines: Line[], _nails: number, logger: Logger) {
  let total = 0;
  for (const [lineIx, line] of lines.entries()) {
    const [min, max] = line.from > line.to ? [line.to, line.from] : [line.from, line.to];
    let count = 0;
    for (const other of lines.slice(0, lineIx)) {
      // intersects when other.from and other.to are on different sides of circle split along line.from to line.to
      const intersects = other.from !== line.from &&
        other.to !== line.from &&
        other.from !== line.to &&
        other.to !== line.to && (
          (other.from > min && other.from < max && !(other.to > min && other.to < max)) ||
          (other.to > min && other.to < max && !(other.from > min && other.from < max))
        );
      if (intersects) {
        logger.debugMed('intersects', line, other);
        ++count;
      }
    }
    total += count;
    logger.debugLow({ line, count, total });
  }
  // 2922965
  logger.success('total', total);
}

function part3(lines: Line[], nails: number, logger: Logger) {
  let best = -1;
  for (let from = 1; from <= nails; ++from) {
    for (let to = from + 1; to <= nails; ++to) {
      let count = 0;
      for (const line of lines) {
        // also intersects when from,to are matched
        const intersects = (line.from > from && line.from < to && !(line.to >= from && line.to <= to)) ||
          (line.to > from && line.to < to && !(line.from >= from && line.from <= to)) ||
          (line.from === from && line.to === to) ||
          (line.to === from && line.from === to);
        if (intersects) {
          logger.debugMed('intersects', { from, to }, line);
          ++count;
        }
      }
      if (count > best) best = count;
      logger.debugLow({ from, to, count, best });
    }
  }
  // 2790
  logger.success('best', best);
}

function main() {
  const { data, logger, part } = new EcArgParser(import.meta.url);
  const lines = data
    .split(',')
    .map((token) => parseInt(token))
    .map((from, i, arr) => ({ from, to: arr[(i + 1) % arr.length] }))
    .slice(0, -1);
  const nails = lines.reduce((acc, item) => Math.max(acc, item.from, item.to), 0);
  logger.debugLow(lines, nails);
  if (part === 1) part1(lines, nails, logger.makeChild('part1'));
  if (part === 2) part2(lines, nails, logger.makeChild('part2'));
  if (part === 3) part3(lines, nails, logger.makeChild('part3'));
}

main();
