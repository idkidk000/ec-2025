import { EcArgParser } from '@/lib/args.1.ts';
import { BinaryHeap } from '@/lib/binary-heap.0.ts';
import { Logger } from '@/lib/logger.0.ts';
import { Point2DLike } from '@/lib/point2d.0.ts';

interface Gap {
  x: number;
  minY: number;
  maxY: number;
}
interface Wall {
  x: number;
  gaps: {
    minY: number;
    maxY: number;
  }[];
}
interface QueueItem extends Point2DLike {
  flaps: number;
}

function part1(gaps: Gap[], logger: Logger) {
  const queue = new BinaryHeap<QueueItem>((a, b) => b.x - a.x || a.flaps - b.flaps, [{ x: 0, y: 0, flaps: 0 }]);
  let best = Infinity;
  while (best === Infinity && queue.length) {
    const item = queue.pop();
    if (!item) throw new Error('oh no');
    // input is already sorted by x
    const nextGap = gaps.find((gap) => gap.x > item.x);
    if (!nextGap) {
      logger.debugLow('finished', item);
      best = item.flaps;
      break;
    }
    const nextX = item.x + 1;
    const nextUp: QueueItem = { x: nextX, y: item.y + 1, flaps: item.flaps + 1 };
    const nextDown: QueueItem = { x: nextX, y: item.y - 1, flaps: item.flaps };
    if (nextX < nextGap.x) queue.push(nextUp, nextDown);
    else {
      if (nextUp.y >= nextGap.minY && nextUp.y <= nextGap.maxY) queue.push(nextUp);
      if (nextDown.y >= nextGap.minY && nextDown.y <= nextGap.maxY) queue.push(nextDown);
    }
  }

  // 52
  logger.success(best);
}

function part2(walls: Wall[], logger: Logger) {
  const queue = new BinaryHeap<QueueItem>((a, b) => b.x - a.x || a.flaps - b.flaps, [{ x: 0, y: 0, flaps: 0 }]);
  let best = Infinity;
  while (best === Infinity && queue.length) {
    const item = queue.pop();
    if (!item) throw new Error('oh no');
    const nextWall = walls.find((wall) => wall.x > item.x);
    if (!nextWall) {
      logger.debugLow('finished', item);
      best = item.flaps;
      break;
    }
    const nextX = item.x + 1;
    const nextItems: QueueItem[] = [
      { x: nextX, y: item.y + 1, flaps: item.flaps + 1 },
      { x: nextX, y: item.y - 1, flaps: item.flaps },
    ];
    const xDist = nextWall.x - nextX;
    for (const nextItem of nextItems)
      if (nextWall.gaps.some((gap) => nextItem.y + xDist >= gap.minY && nextItem.y - xDist <= gap.maxY)) queue.push(nextItem);
  }

  // 680
  logger.success(best);
}

function part3(walls: Wall[], logger: Logger) {
  const queue = new BinaryHeap<QueueItem>((a, b) => b.x - a.x || a.flaps - b.flaps, [{ x: 0, y: 0, flaps: 0 }]);
  const endX = walls[walls.length - 1].x;
  let best = Infinity;

  while (queue.length) {
    const item = queue.pop();
    if (!item) throw new Error('oh no');

    if (item.x === endX) {
      best = item.flaps;
      logger.debugLow('finished', item);
      break;
    }

    const nextWalls = walls.filter(({ x }) => x > item.x);
    const [nextWall] = nextWalls;
    const xDist = nextWall.x - item.x;
    // y range we can actually reach by nextWall
    const nextMinY = item.y - xDist;
    const nextMaxY = item.y + xDist;

    for (const gap of nextWall.gaps) {
      // further constrain y range by gap range
      const minY = Math.max(nextMinY, gap.minY);
      const maxY = Math.min(nextMaxY, gap.maxY);
      const minFlaps = Math.ceil((xDist + minY - item.y) / 2);
      const maxFlaps = Math.floor((xDist + maxY - item.y) / 2);

      // loop over flaps, break out on first match
      for (let flaps = minFlaps; flaps <= maxFlaps; ++flaps) {
        // skip ahead to nextWall
        const nextItem: QueueItem = {
          x: item.x + xDist,
          y: item.y - xDist + flaps * 2,
          flaps: item.flaps + flaps,
        };
        // test nextItem against all remaining walls
        if (
          nextWalls.slice(1).every((wall) => {
            const xDist = wall.x - nextItem.x;
            return wall.gaps.some((gap) => nextItem.y + xDist >= gap.minY && nextItem.y - xDist <= gap.maxY);
          })
        ) {
          // push and break out
          queue.push(nextItem);
          break;
        }
      }
    }
  }

  // 4362553
  logger.success(best);
}

function main() {
  const { data, logger, part } = new EcArgParser(import.meta.url);
  const gaps: Gap[] = data.split('\n').map((line) => {
    const tokens = line.split(',');
    const x = parseInt(tokens[0]);
    const y = parseInt(tokens[1]);
    const height = parseInt(tokens[2]);
    return {
      x,
      minY: y,
      maxY: y + height - 1,
    };
  });
  const walls: Wall[] = new Set(gaps.map(({ x }) => x)).keys().map((x) => ({
    x,
    gaps: gaps.filter((gap) => gap.x === x).map(({ minY, maxY }) => ({ minY, maxY })),
  })).toArray();
  logger.debugHigh(gaps);
  if (part === 1) part1(gaps, logger.makeChild('part1'));
  if (part === 2) part2(walls, logger.makeChild('part2'));
  if (part === 3) part3(walls, logger.makeChild('part3'));
}

main();
