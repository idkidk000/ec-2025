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
  const slices: { x: number; holes: { minY: number; maxY: number }[] }[] = [
    // { x: 0, holes: [{ minY: 0, maxY: 0 }] }
  ];
  const xs = new Set(holes.map(({ x }) => x));
  for (const x of xs) {
    const xHoles = holes.filter((hole) => hole.x === x);
    slices.push({ x, holes: xHoles.map(({ minY, maxY }) => ({ minY, maxY })) });
  }
  logger.debugLow(slices);
  // // TODO: loop through slices, prune inaccessible areas of holes in next
  // for (let i = 0; i < slices.length - 1; ++i) {
  //   const current = slices[i];
  //   const next = slices[i + 1];
  // }

  const queue = new BinaryHeap<QueueItem>((a, b) => b.x - a.x || a.flaps - b.flaps, [{ x: 0, y: 0, flaps: 0 }]);
  let best = Infinity;
  const seen = new PackedSet(Point2D.hash);
  while (best === Infinity && queue.length) {
    const item = queue.pop();
    if (!item) throw new Error('oh no');
    if (seen.has(item)) continue;
    seen.add(item);
    const nextSlices = slices.filter(({ x }) => x > item.x);
    if (nextSlices.length === 0) {
      logger.debugLow('finished', item);
      best = item.flaps;
    }
    // TODO: we could probably skip ahead to the next slice
    const nextItems: QueueItem[] = [
      { x: item.x + 1, y: item.y + 1, flaps: item.flaps + 1 },
      { x: item.x + 1, y: item.y - 1, flaps: item.flaps },
    ];
    for (const nextItem of nextItems) {
      if (
        nextSlices.every((slice) => {
          const xDist = slice.x - nextItem.x;
          return slice.holes.some((hole) => nextItem.y + xDist >= hole.minY && nextItem.y - xDist <= hole.maxY);
        })
      ) { queue.push(nextItem); }
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
