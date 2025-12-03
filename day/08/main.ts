import { parseArgs } from '@/lib/args.0.ts';
import { Logger } from '@/lib/logger.0.ts';
import { Utils } from '../../lib/utils.0.ts';

function part1(points: number[], logger: Logger) {
  const nails = 32;
  let total = 0;
  for (let currentIx = 0; currentIx < points.length - 1; ++currentIx) {
    const nextIx = currentIx + 1;
    const current = points[currentIx];
    const next = points[nextIx % points.length];
    const absDiff = Math.abs(current - next);
    const center = absDiff === nails / 2;
    logger.debugMed({ current, next, absDiff, center });
    if (center) ++total;
  }
  // 63
  logger.success('total', total);
}

function part2(points: number[], logger: Logger) {
  const lines = points.slice(0, -1).map((point, i) => ({ from: point, to: points[i + 1] }));
  logger.debugLow(points, lines);
  const nails = 256;
  let total = 0;
  for (const [lineIx, line] of lines.entries()) {
    logger.debugLow('checking', { line, lineIx });
    //FIXME: this is incredibly stupid
    const left = new Set<number>();
    const right = new Set<number>();
    const [min, max] = Utils.minMax(line.from, line.to);
    for (let i = 1; i <= nails; ++i) {
      if (i === line.from || i === line.to) continue;
      if (i > min && i < max) left.add(i);
      else right.add(i);
    }
    for (const other of lines.slice(0, lineIx)) {
      // intersects when other.from and other.to are on different sides of circle split along line.from to line.to
      const intersects = (left.has(other.from) && right.has(other.to)) || (right.has(other.from) && left.has(other.to));
      if (intersects) {
        logger.debugMed('intersects', other);
        ++total;
      }
    }
  }
  // 2922965
  logger.success('total', total);
}

function part3(points: number[], logger: Logger) {
  // fairly sure this is karger min cut problem but i don't remember how to graphs
  const lines = points.slice(0, -1).map((point, i) => ({ from: point, to: points[i + 1] }));
  logger.debugLow(points, lines);
  const nails = 256;
  const results: { from: number; to: number; count: number }[] = [];
  // FIXME: this includes both f:1, t:10 and f:10, t:1
  for (let from = 1; from <= nails; ++from) {
    for (let to = 1; to <= nails; ++to) {
      if (from === to) continue;
      logger.debugLow('testing', { from, to });
      //FIXME: this is incredibly stupid
      const left = new Set<number>();
      const right = new Set<number>();
      const [min, max] = Utils.minMax(from, to);
      for (let i = 1; i <= nails; ++i) {
        if (i === from || i === to) continue;
        if (i > min && i < max) left.add(i);
        else right.add(i);
      }
      let count = 0;
      for (const line of lines) {
        const intersects = (left.has(line.from) && right.has(line.to)) || (right.has(line.from) && left.has(line.to)) ||
          (line.from === from && line.to === to) || (line.to === from && line.from === to);
        if (intersects) {
          logger.debugMed('intersects', line);
          ++count;
        }
      }
      results.push({ from, to, count });
    }
  }
  const best = results.toSorted((a, b) => b.count - a.count)[0];
  logger.debugLow({ best });
  // 2790
  logger.success('max', best.count);
}

function main() {
  const { data, logger, part } = parseArgs(import.meta.url);
  const points = data.split(',').map((token) => parseInt(token));
  logger.debugLow(points);
  if (part === 1) part1(points, logger.makeChild('part1'));
  if (part === 2) part2(points, logger.makeChild('part2'));
  if (part === 3) part3(points, logger.makeChild('part3'));
}

main();
