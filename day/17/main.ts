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

  // simulate the volcano and generate sets of oob coordinates per timestep
  const oobs = new Map<number, PackedSet<Point2DLike, number>>();
  for (let radius = 1; radius <= Math.max(volcano.rows, volcano.cols); ++radius)
    oobs.set(radius, new PackedSet(Point2D.pack32, Point2D.unpack32, [...Point2D.neighbours(center, radius, Offset2D.Circle), center]));
  logger.debugLow('oobs', oobs.entries().map(([k, v]) => [k, v.size]).toArray());

  enum Quadrant {
    North = 8,
    East = 4,
    South = 2,
    West = 1,
  }
  const ALL_QUADRANTS = Quadrant.North | Quadrant.East | Quadrant.South | Quadrant.West;
  const TIMESTEP = 30;

  /** not perfect but hopefully good enough */
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

  // const grid = new Grid(volcano);
  // grid.fill((_, coord) => getQuadrant(coord));
  // logger.info(grid);

  const offsets = Point2D.offsets(1, Offset2D.Cardinal);
  /** first level index is timestep*/
  // TODO: see if more of the type can be inferred
  // FIXME: i think this is still not good enough
  const pointTimes = new DefaultMap<number, PackedMap<Point2DLike, { checkpoints: number; elapsed: number }, number>>(() =>
    new PackedMap<Point2DLike, { checkpoints: number; elapsed: number }, number>(Point2D.pack32, Point2D.unpack32)
  );
  let lowestCompleted = Infinity;

  // for debug
  const checkpointHighestElapsed = new Map<number, number>();

  function recurse(position: Point2DLike, elapsed: number, checkpoints: number, path: Point2DLike[]) {
    const timestep = Math.floor(elapsed / TIMESTEP);
    // debug
    if ((checkpointHighestElapsed.get(checkpoints) ?? 0) < elapsed) {
      const grid = new Grid(volcano);
      const currentOobs = oobs.get(timestep);
      grid.inspector = (cell, coord) => {
        const onPath = path.find((pos) => Point2D.isEqual(pos, coord));
        const destroyed = currentOobs?.has(coord);
        const isCurrent = Point2D.isEqual(position, coord);
        // deno-lint-ignore no-non-null-assertion
        const isStart = Point2D.isEqual(start!, coord);
        return onPath
          ? `${isCurrent ? ansiStyles.fgIntense.green : isStart ? ansiStyles.fgIntense.cyan : ansiStyles.fgIntense.red}${ansiStyles.bold}${
            destroyed ? '#' : cell
          }${ansiStyles.reset}`
          : destroyed
          ? '#'
          : String(cell);
      };
      logger.debugLow({ position, elapsed, checkpoints, pathLen: path.length }, grid);
      checkpointHighestElapsed.set(checkpoints, elapsed);
    }
    if (elapsed >= lowestCompleted) return;
    const pointBest = pointTimes.get(timestep).get(position);
    if (pointBest && pointBest.checkpoints >= checkpoints && pointBest.elapsed <= elapsed) {
      // BUG: this is still wrong. just adding timestep as a primary index is not enough. a path which took slightly longer and falls into the same timestep might take longer before part of it gets destroyed
      if (checkpoints === ALL_QUADRANTS) logger.debugMed('abort due to pointBest', { position, elapsed, checkpoints, pointBest });
      return;
    }
    pointTimes.get(timestep).set(position, { checkpoints, elapsed });

    // deno thinks the `start` const which i already asserted was not undefined might now be undefined
    // deno-lint-ignore no-non-null-assertion
    if ((checkpoints & ALL_QUADRANTS) === ALL_QUADRANTS && Point2D.isEqual(start!, position)) {
      logger.debugLow('completed', elapsed);
      lowestCompleted = elapsed;
      return;
    }

    // FIXME: these could be better sorted according to quadrant
    for (const offset of offsets) {
      const nextPosition = Point2D.add(position, offset);
      // simple grid bounds check
      if (!volcano.inBounds(nextPosition)) continue;
      const quadrant = getQuadrant(nextPosition);
      // FIXME: this assumes that we always start in north
      // hopefully these constraints aren't too restrictive
      if (quadrant === Quadrant.East && (!(checkpoints & Quadrant.North))) continue;
      if (quadrant === Quadrant.South && (!(checkpoints & Quadrant.East))) continue;
      if (quadrant === Quadrant.West && (!(checkpoints & Quadrant.South))) continue;
      const nextElapsed = elapsed + (volcano.cellAt(nextPosition) ?? 0);
      const nextPath = [...path, nextPosition];
      const nextTimestep = Math.floor(nextElapsed / TIMESTEP);
      const nextOobs = oobs.get(nextTimestep);
      if (timestep === nextTimestep && nextOobs?.has(position)) continue;
      // timestep has changed - need to do full path check
      if (timestep !== nextTimestep && nextPath.some((position) => nextOobs?.has(position))) continue;
      recurse(nextPosition, nextElapsed, checkpoints | quadrant, nextPath);
    }
  }

  recurse(Utils.pick(start, ['x', 'y']), 0, 0, []);

  logger.success(lowestCompleted);
}

function main() {
  const { data, logger, part } = new EcArgParser(import.meta.url);
  if (part === 1) part1(data, logger.makeChild('part1'));
  if (part === 2) part2(data, logger.makeChild('part2'));
  if (part === 3) part3(data, logger.makeChild('part3'));
}

main();
