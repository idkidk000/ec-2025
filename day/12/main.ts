import { EcArgParser } from '@/lib/args.1.ts';
import { BinaryHeap } from '@/lib/binary-heap.0.ts';
import { CoordSystem, Grid } from '@/lib/grid.0.ts';
import { HashedSet } from '@/lib/hashed-set.0.ts';
import { Logger } from '@/lib/logger.0.ts';
import { Offset2D, Point2D, Point2DLike } from '@/lib/point2d.0.ts';

function part1(grid: Grid<number, CoordSystem.Xy>, logger: Logger) {
  logger.debugLow(grid);
  const destroyed = new HashedSet(Point2D.hash, [{ x: 0, y: grid.rows - 1 }]);

  function fill(point: Point2DLike) {
    // deno-lint-ignore no-non-null-assertion
    const value = grid.cellAt(point)!;
    for (const neighbour of Point2D.neighbours(point, 1, Offset2D.Cardinal)) {
      // deno-lint-ignore no-non-null-assertion
      if (grid.inBounds(neighbour) && grid.cellAt(neighbour)! <= value && !destroyed.has(neighbour)) {
        destroyed.add(neighbour);
        fill(neighbour);
      }
    }
  }

  fill({ x: 0, y: grid.rows - 1 });
  logger.debugLow({ destroyed });
  // 244
  logger.success('total', destroyed.size);
}

function part2(grid: Grid<number, CoordSystem.Xy>, logger: Logger) {
  const start: ({ depth: number } & Point2DLike)[] = [
    { depth: 0, x: 0, y: grid.rows - 1 },
    { depth: 0, x: grid.cols - 1, y: 0 },
  ];

  const queue = new BinaryHeap((a, b) => a.depth - b.depth, start);
  const destroyed = new HashedSet<Point2DLike>(Point2D.hash, start);

  while (queue.length) {
    // deno-lint-ignore no-non-null-assertion
    const item = queue.pop()!;
    // deno-lint-ignore no-non-null-assertion
    const value = grid.cellAt(item)!;
    for (const neighbour of Point2D.neighbours(item, 1, Offset2D.Cardinal)) {
      // deno-lint-ignore no-non-null-assertion
      if (grid.inBounds(neighbour) && grid.cellAt(neighbour)! <= value && !destroyed.has(neighbour)) {
        destroyed.add(neighbour);
        queue.push({ depth: item.depth + 1, ...neighbour });
      }
    }
  }

  logger.debugLow(destroyed);
  // 5716
  logger.success('total', destroyed.size);
}

function part3(grid: Grid<number, CoordSystem.Xy>, logger: Logger) {
  function simulateOne(start: Point2DLike, initial: HashedSet<Point2DLike>) {
    const destroyed = initial.clone();
    function fill(point: Point2DLike) {
      // deno-lint-ignore no-non-null-assertion
      const value = grid.cellAt(point)!;
      for (const neighbour of Point2D.neighbours(point, 1, Offset2D.Cardinal)) {
        // deno-lint-ignore no-non-null-assertion
        if (grid.inBounds(neighbour) && grid.cellAt(neighbour)! <= value && !destroyed.has(neighbour)) {
          destroyed.add(neighbour);
          fill(neighbour);
        }
      }
    }
    destroyed.add(start);
    fill(start);
    return destroyed;
  }

  let destroyed = new HashedSet<Point2DLike>(Point2D.hash);
  const bests = new Map<number, (Point2DLike & { value: number; score: number })>();

  for (let i = 0; i < 3; ++i) {
    for (const [start, value] of grid.cellEntries()) {
      if (destroyed.has(start)) continue;
      const result = simulateOne(start, destroyed);
      const score = result.size;
      if (score > (bests.get(i)?.score ?? 0)) bests.set(i, { score, value, ...start });
      logger.debugLow({ i, score, best: bests.get(i) });
    }
    const best = bests.get(i);
    if (!best) throw new Error(`did not find best for ${i}`);
    logger.info({ i, best });
    destroyed = simulateOne(best, destroyed);
  }

  const start: ({ depth: number } & Point2DLike)[] = bests.values().map((item) => ({ depth: 0, ...item })).toArray();

  const queue = new BinaryHeap((a, b) => a.depth - b.depth, start);
  const finalDestroyed = new HashedSet<Point2DLike>(Point2D.hash, start);

  while (queue.length) {
    // deno-lint-ignore no-non-null-assertion
    const item = queue.pop()!;
    // deno-lint-ignore no-non-null-assertion
    const value = grid.cellAt(item)!;
    for (const neighbour of Point2D.neighbours(item, 1, Offset2D.Cardinal)) {
      // deno-lint-ignore no-non-null-assertion
      if (grid.inBounds(neighbour) && grid.cellAt(neighbour)! <= value && !finalDestroyed.has(neighbour)) {
        finalDestroyed.add(neighbour);
        queue.push({ depth: item.depth + 1, ...neighbour });
      }
    }
  }

  logger.debugLow('finalDestroyed', finalDestroyed, finalDestroyed.size);
  // 4036
  logger.success('total', finalDestroyed.size);
}

function main() {
  const { data, logger, part } = new EcArgParser(import.meta.url);
  const grid = new Grid(data.split('\n').map((line) => line.split('').map((token) => parseInt(token))), CoordSystem.Xy);
  if (part === 1) part1(grid, logger.makeChild('part1'));
  if (part === 2) part2(grid, logger.makeChild('part2'));
  if (part === 3) part3(grid, logger.makeChild('part3'));
}

main();
