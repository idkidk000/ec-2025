import { EcArgParser } from '@/lib/args.1.ts';
import { CoordSystem, Grid } from '@/lib/grid.0.ts';
import { Logger } from '@/lib/logger.0.ts';
import { Offset2D, Point2D, Point2DLike } from '@/lib/point2d.0.ts';
import { BinaryHeap } from '@/lib/binary-heap.0.ts';
import { PackedSet } from '@/lib/packed-set.0.ts';
import { Utils } from '../../lib/utils.0.ts';
import { checkPrime } from 'node:crypto';

function part1(data: string, logger: Logger) {
  const volcano = new Grid(data.split('\n').map((line) => line.split('').map((token) => token === '@' ? 0 : parseInt(token))), CoordSystem.Xy);
  const center = volcano.find((value) => value === 0);
  logger.debugLow({ center });
  if (!center) throw new Error('oh no');
  const total = Point2D.neighbours(center, 10, Offset2D.Circle)
    .reduce((acc, item) => acc + (volcano.cellAt(item) ?? 0), 0);
  // 1645
  logger.info(total);
}

function part2(data: string, logger: Logger) {
  const volcano = new Grid(data.split('\n').map((line) => line.split('').map((token) => token === '@' ? 0 : parseInt(token))), CoordSystem.Xy);
  const center = volcano.find((value) => value === 0);
  logger.debugLow({ center });
  if (!center) throw new Error('oh no');
  const radiusDamage = new Map<number, number>();
  for (let radius = 1; true; ++radius) {
    const coords = Point2D.neighbours(center, radius, Offset2D.Circle);
    let damage = 0;
    for (const coord of coords) {
      const value = volcano.cellAt(coord) ?? 0;
      if (value > 0) {
        damage += value;
        volcano.cellSet(coord, 0);
      }
    }
    logger.debugLow({ radius, damage });
    if (damage === 0) break;
    radiusDamage.set(radius, damage);
  }
  logger.debugLow(radiusDamage);
  const [result] = radiusDamage.entries().toArray()
    .toSorted(([, a], [, b]) => b - a)
    .map(([radius, damage]) => radius * damage);
  // 66261
  logger.success(result);
}

function part3(data: string, logger: Logger) {
  const volcano = new Grid(
    data.split('\n').map((line) => line.split('').map((token) => token === '@' ? 0 : token === 'S' ? -1 : parseInt(token))),
    CoordSystem.Xy,
  );
  const center = volcano.find((value) => value === 0);
  const start = volcano.find((value) => value === -1);
  if (!center || !start) throw new Error('oh no');
  volcano.cellSet(start, 0);
  logger.debugLow({ center, start });

  // simulate the volcano and generate sets of oob coordinates per timestep
  const oobs = new Map<number, PackedSet<Point2DLike, number>>();
  for (let radius = 1; radius <= Math.max(volcano.rows, volcano.cols); ++radius)
    oobs.set(radius, new PackedSet(Point2D.hash, undefined, [...Point2D.neighbours(center, radius, Offset2D.Circle), center]));
  logger.debugLow('oobs', oobs.entries().map(([k, v]) => [k, v.size]).toArray());

  enum Quadrant {
    North = 8,
    East = 4,
    South = 2,
    West = 1,
  }
  const allQuadrants = Quadrant.North | Quadrant.East | Quadrant.South | Quadrant.West;

  function getQuadrant(point: Point2DLike): Quadrant {
    const northDist = volcano.rows - point.y;
    const eastDist = volcano.cols - point.x;
    const southDist = point.y;
    const westDist = point.x;
    if (northDist <= Math.min(eastDist, westDist)) return Quadrant.North;
    if (eastDist <= Math.min(northDist, southDist)) return Quadrant.East;
    if (southDist <= Math.min(eastDist, westDist)) return Quadrant.South;
    if (westDist <= Math.min(northDist, southDist)) return Quadrant.West;
    throw new Error('oh no');
  }

  interface QueueItem {
    position: Point2DLike;
    elapsed: number;
    /** mask of `Quadrant`s */
    checkpoints: number;
    /** needs to be fully checked whenever the timestep increments */
    path: Point2DLike[];
  }

  /** this might be better as a recursive function */
  const queue = new BinaryHeap<QueueItem>((a, b) =>
    b.checkpoints - a.checkpoints ||
    a.elapsed - b.elapsed
  );

  queue.push({ elapsed: 0, position: Utils.pick(start, ['x', 'y']), checkpoints: getQuadrant(start), path: [Utils.pick(start, ['x', 'y'])] });

  const offsets = Point2D.offsets(1, Offset2D.Cardinal);

  const seenCheckpoints = new Set<number>();
  const seenElapseds = new Set<number>();
  let best = Infinity;
  while (queue.length) {
    const item = queue.pop();
    if (!item) continue;
    if (!seenCheckpoints.has(item.checkpoints) || !seenElapseds.has(item.elapsed)) {
      logger.debugMed({ item });
      seenCheckpoints.add(item.checkpoints);
      seenElapseds.add(item.elapsed);
    }
    if (item.elapsed >= best) continue;
    if ((item.checkpoints & allQuadrants) === allQuadrants && Point2D.isEqual(start, item.position)) {
      logger.debugLow('completed', item);
      if (item.elapsed < best) best = item.elapsed;
      continue;
    }
    for (const offset of offsets) {
      const nextPosition = Point2D.add(item.position, offset);
      if (!volcano.inBounds(nextPosition)) continue;
      const nextElapsed = item.elapsed + (volcano.cellAt(nextPosition) ?? 0);
      const nextPath = [...item.path, nextPosition];
      if (Math.floor(item.elapsed / 30) !== Math.floor(nextElapsed / 30)) {
        // need to do full path check
        if (nextPath.some((position) => oobs.get(Math.floor(nextElapsed / 30))?.has(position))) continue;
      } else if (oobs.get(Math.floor(nextElapsed / 30))?.has(item.position)) { continue; }
      const quadrant = getQuadrant(nextPosition);
      // FIXME: this assumes that we always start in north
      if (quadrant === Quadrant.East && (!(item.checkpoints & Quadrant.North))) continue;
      if (quadrant === Quadrant.South && (!(item.checkpoints & Quadrant.East))) continue;
      if (quadrant === Quadrant.West && (!(item.checkpoints & Quadrant.South))) continue;
      const next: QueueItem = {
        checkpoints: item.checkpoints | quadrant,
        elapsed: nextElapsed,
        position: nextPosition,
        path: nextPath,
      };
      queue.push(next);
    }
  }

  logger.success(best);
}

function main() {
  const { data, logger, part } = new EcArgParser(import.meta.url);
  if (part === 1) part1(data, logger.makeChild('part1'));
  if (part === 2) part2(data, logger.makeChild('part2'));
  if (part === 3) part3(data, logger.makeChild('part3'));
}

main();
