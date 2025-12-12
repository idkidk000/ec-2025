import { EcArgParser } from '@/lib/args.1.ts';
import { CoordSystem, Grid } from '@/lib/grid.0.ts';
import { ansiStyles, Logger } from '@/lib/logger.0.ts';
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

  enum Quadrant {
    North = 8,
    West = 4,
    South = 2,
    East = 1,
  }
  const ALL_QUADRANTS = Quadrant.North | Quadrant.East | Quadrant.South | Quadrant.West;
  const TIMESTEP = 30;

  function getQuadrant(point: Point2DLike): Quadrant {
    const northDist = volcano.rows - 1 - point.y;
    const eastDist = volcano.cols - 1 - point.x;
    const southDist = point.y;
    const westDist = point.x;
    if (northDist <= Math.min(eastDist, westDist)) return Quadrant.North;
    if (southDist <= Math.min(eastDist, westDist)) return Quadrant.South;
    if (eastDist <= Math.min(northDist, southDist)) return Quadrant.East;
    if (westDist <= Math.min(northDist, southDist)) return Quadrant.West;
    throw new Error('oh no');
  }
  // volcano.inspector = (cell, coord) => {
  //   const quad = getQuadrant(coord);
  //   return `${
  //     quad === Quadrant.North
  //       ? ansiStyles.fgIntense.red
  //       : quad === Quadrant.East
  //       ? ansiStyles.fgIntense.green
  //       : quad === Quadrant.South
  //       ? ansiStyles.fgIntense.cyan
  //       : ansiStyles.fgIntense.yellow
  //   }${cell}${ansiStyles.reset}`;
  // };
  // logger.info(volcano);
  // return;

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

    /** `checkpoints` is a bitfield of `Quadrant` */
    // deno-lint-ignore no-inner-declarations
    function recurse(position: Point2DLike, elapsed: number, checkpoints: number) {
      if (!start) throw new Error('shush');
      if (elapsed >= nextTimestepAt || elapsed >= lowestCompleted || elapsed >= (pointTimes.get(checkpoints).get(position) ?? Infinity)) return;
      pointTimes.get(checkpoints).set(position, elapsed);
      if (checkpoints === ALL_QUADRANTS && Point2D.isEqual(start, position)) {
        logger.debugLow('completed', { timestep, checkpoints, elapsed });
        lowestCompleted = elapsed;
        return;
      }
      for (const offset of offsets) {
        const nextPosition = Point2D.add(position, offset);
        if (!volcano.inBounds(nextPosition)) continue;
        if (destroyed.has(nextPosition)) continue;
        const nextQuadrant = getQuadrant(nextPosition);
        if (nextQuadrant === Quadrant.West && (!(checkpoints & Quadrant.North))) continue;
        if (nextQuadrant === Quadrant.South && (!(checkpoints & Quadrant.West))) continue;
        if (nextQuadrant === Quadrant.East && (!(checkpoints & Quadrant.South))) continue;
        const nextElapsed = elapsed + (volcano.cellAt(nextPosition) ?? 0);
        recurse(nextPosition, nextElapsed, checkpoints | nextQuadrant);
      }
    }

    if (destroyed.has(start)) break;
    recurse(Utils.pick(start, ['x', 'y']), 0, 0);
  }

  logger.success(lowestCompleted);
}

function main() {
  const { data, logger, part } = new EcArgParser(import.meta.url);
  if (part === 1) part1(data, logger.makeChild('part1'));
  if (part === 2) part2(data, logger.makeChild('part2'));
  if (part === 3) part3(data, logger.makeChild('part3'));
}

main();
