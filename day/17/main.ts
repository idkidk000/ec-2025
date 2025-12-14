import { EcArgParser } from '@/lib/args.1.ts';
import { CoordSystem, Grid } from '@/lib/grid.0.ts';
import { Logger } from '@/lib/logger.0.ts';
import { PackedMap } from '@/lib/packed-map.0.ts';
import { PackedSet } from '@/lib/packed-set.0.ts';
import { Offset2D, Point2D, Point2DLike } from '@/lib/point2d.0.ts';
import { Utils } from '@/lib/utils.0.ts';
import { DefaultMap } from '@/lib/default-map.0.ts';

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
  const center = volcano.find((value) => value === 0) as Point2DLike;
  const start = volcano.find((value) => value === -1) as Point2DLike;
  if (!center || !start) throw new Error('oh no');
  volcano.cellSet(start, 0);
  logger.debugLow({ center, start });

  enum Heading {
    North = 8,
    East = 4,
    South = 2,
    West = 1,
  }

  const HEADING_NE = Heading.North | Heading.East;
  const HEADING_NES = Heading.North | Heading.East | Heading.South;
  const HEADING_NESW = Heading.North | Heading.East | Heading.South | Heading.West;

  const TIMESTEP = 30;

  const offsets = Point2D.offsets(1, Offset2D.Cardinal);

  function getCheckpoint(point: Point2DLike): Heading | 0 {
    if (point.x === center.x && point.y > center.y) return Heading.North;
    if (point.y === center.y && point.x > center.x) return Heading.East;
    if (point.x === center.x && point.y < center.y) return Heading.South;
    if (point.y === center.y && point.x < center.x) return Heading.West;
    return 0;
  }

  function getQuadrant(point: Point2DLike): Heading {
    const northDist = volcano.rows - 1 - point.y;
    const eastDist = volcano.cols - 1 - point.x;
    const southDist = point.y;
    const westDist = point.x;
    if (northDist <= Math.min(eastDist, westDist)) return Heading.North;
    if (eastDist <= Math.min(northDist, southDist)) return Heading.East;
    if (southDist <= Math.min(eastDist, westDist)) return Heading.South;
    if (eastDist <= Math.min(northDist, southDist)) return Heading.East;
    if (westDist <= Math.min(northDist, southDist)) return Heading.West;
    throw new Error('oh no');
  }

  function simulate(timestep: number): number {
    let bestTime = Infinity;
    /** first level index is `checkpoints` */
    const pointTimes = new DefaultMap<number, PackedMap<Point2DLike, number, number>>(() =>
      new PackedMap<Point2DLike, number, number>(Point2D.pack32, Point2D.unpack32)
    );
    const nextTimestepAt = (timestep + 1) * TIMESTEP;
    const destroyed = new PackedSet(Point2D.pack32, Point2D.unpack32, [...Point2D.neighbours(center, timestep, Offset2D.Circle), center]);
    // these are a bit unsafe since there might be a very fast path through east, for example
    const northTimeout = nextTimestepAt * .25;
    const eastTimeout = nextTimestepAt * .5;
    const southTimeout = nextTimestepAt * .75;

    /** `checkpoints` is a bitfield of `Checkpoint`s */
    function recurse(position: Point2DLike, elapsed: number, checkpoints: number): void {
      if (elapsed >= nextTimestepAt || elapsed >= bestTime || elapsed >= (pointTimes.get(checkpoints).get(position) ?? Infinity)) return;
      pointTimes.get(checkpoints).set(position, elapsed);
      if (checkpoints === HEADING_NESW && Point2D.isEqual(start, position)) {
        logger.debugLow('completed', { timestep, elapsed });
        bestTime = elapsed;
        return;
      }
      // offsetting the index into `offsets` based on last checkpoint seems sensible but slows things down
      for (const offset of offsets) {
        const nextPosition = Point2D.add(position, offset);
        if (!volcano.inBounds(nextPosition) || destroyed.has(nextPosition)) continue;

        // force paths to be clockwise, the same as `offsets`
        const nextQuadrant = getQuadrant(nextPosition);
        if (
          (nextQuadrant === Heading.East && !(checkpoints & Heading.North)) ||
          (nextQuadrant === Heading.South && (checkpoints & HEADING_NE) !== HEADING_NE) ||
          (nextQuadrant === Heading.West && (checkpoints & HEADING_NES) !== HEADING_NES)
        ) { return; }

        // prune any paths which aren't progressing fast enough
        const nextElapsed = elapsed + (volcano.cellAt(nextPosition) ?? 0);
        if (
          (nextQuadrant === Heading.North && checkpoints !== HEADING_NESW && nextElapsed > northTimeout) ||
          (nextQuadrant === Heading.East && nextElapsed > eastTimeout) ||
          (nextQuadrant === Heading.South && nextElapsed > southTimeout)
        ) { return; }

        recurse(nextPosition, nextElapsed, checkpoints | getCheckpoint(nextPosition));
      }
    }

    if (destroyed.has(start)) throw new Error('start is destroyed');
    recurse(Utils.pick(start, ['x', 'y']), 0, 0);
    return bestTime;
  }

  let best = Infinity;
  for (let timestep = 1; best === Infinity; ++timestep) {
    best = simulate(timestep);
    logger.debugLow({ timestep, best });
  }

  const result = best * Math.floor(best / TIMESTEP);
  // 42143
  logger.success(result);
}

function main() {
  const { data, logger, part } = new EcArgParser(import.meta.url);
  if (part === 1) part1(data, logger.makeChild('part1'));
  if (part === 2) part2(data, logger.makeChild('part2'));
  if (part === 3) part3(data, logger.makeChild('part3'));
}

main();
