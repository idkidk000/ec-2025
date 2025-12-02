import { parseArgs } from '@/lib/args.0.ts';
import { Logger } from '@/lib/logger.0.ts';
import { Utils } from '@/lib/utils.0.ts';

interface Segment {
  left?: number;
  spine: number;
  right?: number;
}
interface Processed {
  swordId: number;
  quality: number;
  segments: Segment[];
}

function process(data: string, logger: Logger): Processed {
  const parts = data.split(':');
  const swordId = parseInt(parts[0]);
  const numbers = parts[1].split(',').map((token) => parseInt(token));
  logger.debugMed({ swordId, numbers });
  const segments: Segment[] = [];
  for (const number of numbers) {
    let found = false;
    for (const segment of segments) {
      if (number < segment.spine && typeof segment.left === 'undefined') {
        segment.left = number;
        found = true;
      } else if (number > segment.spine && typeof segment.right === 'undefined') {
        segment.right = number;
        found = true;
      }
      if (found) break;
    }
    if (!found) segments.push({ spine: number });
    logger.debugMed({ number }, segments);
  }
  logger.debugMed(segments.map((segment) => `\n${segment.left ?? ' '} - ${segment.spine} - ${segment.right ?? ' '}`).join(''));
  const quality = parseInt(segments.map(({ spine }) => String(spine)).join(''));
  // 2478587386
  return { swordId, quality, segments };
}

function part1(data: string, logger: Logger) {
  const { quality } = process(data, logger);
  // 2478587386
  logger.success('quality', quality);
}

function part2(data: string, logger: Logger) {
  const qualities = data.split('\n').map((line) => process(line, logger).quality);
  const [min, max] = Utils.minMax(...qualities);
  logger.debugLow(qualities, { min, max });
  const diff = max - min;
  // 8348978937439
  logger.success('diff', diff);
}

function part3(data: string, logger: Logger) {
  const swords = data.split('\n').map((line) => process(line, logger));
  const sorted = swords.toSorted((a, b) => {
    if (a.quality !== b.quality) return b.quality - a.quality;
    for (let i = 0; i < Math.max(a.segments.length, b.segments.length); ++i) {
      const aSegment = a.segments.at(i) ?? { spine: 0 };
      const bSegment = b.segments.at(i) ?? { spine: 0 };
      const aScore = parseInt(`${aSegment.left ?? ''}${aSegment.spine ?? ''}${aSegment.right ?? ''}`);
      const bScore = parseInt(`${bSegment.left ?? ''}${bSegment.spine ?? ''}${bSegment.right ?? ''}`);
      if (aScore !== bScore) return bScore - aScore;
    }
    return b.swordId - a.swordId;
  });
  logger.debugLow(sorted.map(({ swordId }) => swordId));
  // logger.debugLow('sorted', sorted);
  const checksum = sorted.reduce((acc, item, i) => acc + item.swordId * (i + 1), 0);
  // 31987430
  logger.success('checksum', checksum);
}

function main() {
  const { data, logger, part } = parseArgs(import.meta.url);
  if (part === 1) part1(data, logger.makeChild('part1'));
  if (part === 2) part2(data, logger.makeChild('part2'));
  if (part === 3) part3(data, logger.makeChild('part3'));
}

main();
