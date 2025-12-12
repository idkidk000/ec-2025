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
  const center = volcano.find((value) => value === 0);
  const start = volcano.find((value) => value === -1);
  if (!center || !start) throw new Error('oh no');
  volcano.cellSet(start, 0);
  logger.debugLow({ center, start });

  enum Checkpoint {
    North = 8,
    East = 4,
    South = 2,
    West = 1,
  }
  const ALL_CHECKPOINTS = Checkpoint.North | Checkpoint.East | Checkpoint.South | Checkpoint.West;
  const TIMESTEP = 30;

  function getCheckpoint(point: Point2DLike): Checkpoint | 0 {
    if (point.y > volcano.rows / 2 && point.x === Math.round((volcano.cols - 1) / 2)) return Checkpoint.North;
    if (point.y < volcano.rows / 2 && point.x === Math.round((volcano.cols - 1) / 2)) return Checkpoint.South;
    if (point.x > volcano.cols / 2 && point.y === Math.round((volcano.rows - 1) / 2)) return Checkpoint.East;
    if (point.x < volcano.cols / 2 && point.y === Math.round((volcano.rows - 1) / 2)) return Checkpoint.West;
    return 0;
  }

  const offsets = Point2D.offsets(1, Offset2D.Cardinal);
  let lowestCompleted = Infinity;

  for (let timestep = 1; lowestCompleted === Infinity; ++timestep) {
    /** first level index is `checkpoints` */
    const pointTimes = new DefaultMap<number, PackedMap<Point2DLike, number, number>>(() =>
      new PackedMap<Point2DLike, number, number>(Point2D.pack32, Point2D.unpack32)
    );
    const nextTimestepAt = (timestep + 1) * TIMESTEP;
    const destroyed = new PackedSet(Point2D.pack32, Point2D.unpack32, [...Point2D.neighbours(center, timestep, Offset2D.Circle), center]);
    logger.debugLow({ timestep, nextTimestepAt });

    /** `checkpoints` is a bitfield of `Checkpoint`s */
    // deno-lint-ignore no-inner-declarations
    function recurse(position: Point2DLike, elapsed: number, checkpoints: number) {
      if (!start) throw new Error('shush');
      if (elapsed >= nextTimestepAt || elapsed >= lowestCompleted || elapsed >= (pointTimes.get(checkpoints).get(position) ?? Infinity)) return;
      pointTimes.get(checkpoints).set(position, elapsed);
      if (checkpoints === ALL_CHECKPOINTS && Point2D.isEqual(start, position)) {
        logger.debugLow('completed', { timestep, checkpoints, elapsed });
        lowestCompleted = elapsed;
        return;
      }
      for (const offset of offsets) {
        const nextPosition = Point2D.add(position, offset);
        if (!volcano.inBounds(nextPosition)) continue;
        if (destroyed.has(nextPosition)) continue;
        const nextCheckpoint = getCheckpoint(nextPosition);
        // prune some nonsense
        if (nextCheckpoint === Checkpoint.East && !(checkpoints & Checkpoint.North)) return;
        if (nextCheckpoint === Checkpoint.South && !(checkpoints & Checkpoint.East)) return;
        if (nextCheckpoint === Checkpoint.West && !(checkpoints & Checkpoint.South)) return;
        const nextCheckpoints = checkpoints | nextCheckpoint;
        const nextElapsed = elapsed + (volcano.cellAt(nextPosition) ?? 0);
        recurse(nextPosition, nextElapsed, nextCheckpoints);
      }
    }

    if (destroyed.has(start)) break;
    recurse(Utils.pick(start, ['x', 'y']), 0, 0);
  }

  logger.debugLow({ lowestCompleted });
  const result = lowestCompleted * Math.floor(lowestCompleted / TIMESTEP);
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
