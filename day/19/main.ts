import { EcArgParser } from '@/lib/args.1.ts';
import { BinaryHeap } from '@/lib/binary-heap.0.ts';
import { Logger } from '@/lib/logger.0.ts';
import { PackedSet } from '@/lib/packed-set.0.ts';
import { Point2D, Point2DLike } from '@/lib/point2d.0.ts';

interface Hole {
  x: number;
  minY: number;
  maxY: number;
}
interface QueueItem extends Point2DLike {
  flaps: number;
}

function part1(holes: Hole[], logger: Logger) {
  const queue = new BinaryHeap<QueueItem>((a, b) => b.x - a.x || a.flaps - b.flaps, [{ x: 0, y: 0, flaps: 0 }]);
  let best = Infinity;
  while (best === Infinity && queue.length) {
    const item = queue.pop();
    if (!item) throw new Error('oh no');
    // input is already sorted by x
    const nextHole = holes.find((hole) => hole.x > item.x);
    if (!nextHole) {
      logger.debugLow('finished', item);
      best = item.flaps;
      break;
    }
    const nextX = item.x + 1;
    const nextUp: QueueItem = { x: nextX, y: item.y + 1, flaps: item.flaps + 1 };
    const nextDown: QueueItem = { x: nextX, y: item.y - 1, flaps: item.flaps };
    // do we care about floor collisions??
    // TODO: prune much more aggressively
    if (nextX < nextHole.x) queue.push(nextUp, nextDown);
    else {
      if (nextUp.y >= nextHole.minY && nextUp.y <= nextHole.maxY) queue.push(nextUp);
      if (nextDown.y >= nextHole.minY && nextDown.y <= nextHole.maxY) queue.push(nextDown);
    }
  }

  // 52
  logger.success(best);
}

function part2(holes: Hole[], logger: Logger) {
  const queue = new BinaryHeap<QueueItem>((a, b) => b.x - a.x || a.flaps - b.flaps, [{ x: 0, y: 0, flaps: 0 }]);
  let best = Infinity;
  while (best === Infinity && queue.length) {
    const item = queue.pop();
    if (!item) throw new Error('oh no');
    const nextHole = holes.find((hole) => hole.x > item.x);
    if (!nextHole) {
      logger.debugLow('finished', item);
      best = item.flaps;
      break;
    }
    const nextHoles = holes.filter((hole) => hole.x === nextHole.x);
    const nextX = item.x + 1;
    const nextItems: QueueItem[] = [
      { x: nextX, y: item.y + 1, flaps: item.flaps + 1 },
      { x: nextX, y: item.y - 1, flaps: item.flaps },
    ];
    const xDist = nextHole.x - nextX;
    for (const nextItem of nextItems)
      if (nextHoles.some((hole) => nextItem.y + xDist >= hole.minY && nextItem.y - xDist <= hole.maxY)) queue.push(nextItem);
  }

  // 680
  logger.success(best);
}

function part3(holes: Hole[], logger: Logger) {
  const walls = new Set(holes.map(({ x }) => x)).keys().map((x) => {
    const xHoles = holes.filter((hole) => hole.x === x);
    return { x, holes: xHoles.map(({ minY, maxY }) => ({ minY, maxY })) };
  }).toArray();

  logger.debugLow(walls);

  const queue = new BinaryHeap<QueueItem>((a, b) => b.x - a.x || a.flaps - b.flaps, [{ x: 0, y: 0, flaps: 0 }]);
  const seen = new PackedSet(Point2D.hash);

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
    // we'll get duplicates from paths through different holes
    if (seen.has(item)) continue;
    seen.add(item);
    const nextWalls = walls.filter(({ x }) => x > item.x);
    const [nextWall] = nextWalls;
    const xDist = nextWall.x - item.x;
    const nextMinY = item.y - xDist;
    const nextMaxY = item.y + xDist;
    for (const hole of nextWall.holes) {
      const minY = Math.max(nextMinY, hole.minY);
      const maxY = Math.min(nextMaxY, hole.maxY);
      const minFlaps = Math.ceil((xDist + minY - item.y) / 2);
      const maxFlaps = Math.floor((xDist + maxY - item.y) / 2);
      for (let flaps = minFlaps; flaps <= maxFlaps; ++flaps) {
        const nextItem = {
          x: item.x + xDist,
          y: item.y - xDist + flaps * 2,
          flaps: item.flaps + flaps,
        };
        // logger.debugMed({ nextItem });
        if (
          nextWalls.every((wall) => {
            const xDist = wall.x - nextItem.x;
            return wall.holes.some((hole) => nextItem.y + xDist >= hole.minY && nextItem.y - xDist <= hole.maxY);
          })
        ) { queue.push(nextItem); }
      }
    }
  }

  // 4362553
  logger.success(best);
}

function main() {
  const { data, logger, part } = new EcArgParser(import.meta.url);
  const holes: Hole[] = data.split('\n').map((line) => {
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
  logger.debugHigh(holes);
  if (part === 1) part1(holes, logger.makeChild('part1'));
  if (part === 2) part2(holes, logger.makeChild('part2'));
  if (part === 3) part3(holes, logger.makeChild('part3'));
}

main();
