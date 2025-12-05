import { EcArgParser } from '@/lib/args.1.ts';
import { Logger } from '@/lib/logger.0.ts';
import { CoordSystem, Grid } from '@/lib/grid.0.ts';
import { HashedMap } from '@/lib/hashed-map.0.ts';
import { Offset2D, Point2D, Point2DLike } from '@/lib/point2d.0.ts';
import { HashedSet } from '../../lib/hashed-set.0.ts';

function part1(grid: Grid<boolean, CoordSystem.Xy>, logger: Logger) {
  const nextState = new HashedMap<Point2DLike, boolean>(Point2D.hash);
  let totalActive = 0;
  for (let round = 0; round < 10; ++round) {
    for (const [current, active] of grid.cellEntries()) {
      let activeNeighbours = 0;
      for (const neighbour of Point2D.neighbours(current, 1, Offset2D.Diagonal))
        if (grid.inBounds(neighbour) && grid.cellAt(neighbour)) ++activeNeighbours;
      const nextActive = activeNeighbours % 2 === (active ? 1 : 0);
      logger.debugMed({ current, active, activeNeighbours, nextActive });
      nextState.set(current, nextActive);
    }
    for (const [point, active] of nextState.entries()) {
      grid.cellSet(point, active);
      if (active) ++totalActive;
    }
    logger.debugLow(round, grid);
    nextState.clear();
  }
  // 483
  logger.success(totalActive);
}

function part2(grid: Grid<boolean, CoordSystem.Xy>, logger: Logger) {
  const nextState = new HashedMap<Point2DLike, boolean>(Point2D.hash);
  let totalActive = 0;
  for (let round = 0; round < 2025; ++round) {
    for (const [current, active] of grid.cellEntries()) {
      let activeNeighbours = 0;
      for (const neighbour of Point2D.neighbours(current, 1, Offset2D.Diagonal))
        if (grid.inBounds(neighbour) && grid.cellAt(neighbour)) ++activeNeighbours;
      const nextActive = activeNeighbours % 2 === (active ? 1 : 0);
      logger.debugMed({ current, active, activeNeighbours, nextActive });
      nextState.set(current, nextActive);
    }
    for (const [point, active] of nextState.entries()) {
      grid.cellSet(point, active);
      if (active) ++totalActive;
    }
    logger.debugLow(round, grid);
    nextState.clear();
  }
  // 1170941
  logger.success(totalActive);
}

function part3(grid: Grid<boolean, CoordSystem.Xy>, logger: Logger) {
  const size = 34;
  const simulationRounds = 1000000000;
  const targetActive = new HashedSet(
    Point2D.hash,
    grid
      .cellEntries()
      .filter(([, active]) => active)
      .map(([point]) => ({
        x: size / 2 - grid.cols / 2 + point.x,
        y: size / 2 - grid.rows / 2 + point.y,
      })),
  );
  const targetInactive = new HashedSet(
    Point2D.hash,
    grid
      .cellEntries()
      .filter(([, active]) => !active)
      .map(([point]) => ({
        x: size / 2 - grid.cols / 2 + point.x,
        y: size / 2 - grid.rows / 2 + point.y,
      })),
  );
  let active = new HashedSet(Point2D.hash);
  let nextActive = new HashedSet(Point2D.hash);
  const offsets = Point2D.offsets(1, Offset2D.Diagonal);
  const getActiveNeighbourCount = (point: Point2DLike) =>
    offsets
      .map((offset) => Point2D.add(point, offset))
      .filter((value) => value.x >= 0 && value.x < size && value.y >= 0 && value.y < size && active.has(value))
      .length;

  // simulate until each activation pattern has two occurrences
  const activations = new Map<number, number[]>();
  for (let round = 0; true; ++round) {
    for (let x = 0; x < size; ++x) {
      for (let y = 0; y < size; ++y) {
        const isActive = active.has({ x, y });
        const count = getActiveNeighbourCount({ x, y });
        if (count % 2 === (isActive ? 1 : 0)) nextActive.add({ x, y });
      }
    }
    if (targetInactive.isDisjointFrom(nextActive) && targetActive.isSubsetOf(nextActive)) {
      if (!activations.has(nextActive.size)) activations.set(nextActive.size, [round]);
      else activations.get(nextActive.size)?.push(round);
      logger.debugLow({ round, count: nextActive.size });
      if (activations.values().every((item) => item.length > 1)) break;
    }
    [active, nextActive] = [nextActive, active];
    nextActive.clear();
  }
  /*
    sample2:
      count 552 at 124
      count 588 at 1140
      both repeat every 4095
      1000000000 / 4095 = 244200
      1000000000 % 4095 = 1000 (so only the 552 at 124 is included)

        244200 * (552 + 588)
      + 552
      = 278388552

  */
  let total = 0;
  for (const [count, rounds] of activations.entries()) {
    const deltas = rounds.map((item, i, arr) => item - (arr.at(i - 1) ?? item)).filter((_, i) => i > 0);
    if (!deltas.every((delta) => delta === deltas[0])) throw new Error(`mismatched deltas count=${count} rounds=${rounds.join()} deltas=${deltas.join()}`);
    const [first] = rounds;
    const [delta] = deltas;
    const occurrences = Math.floor(simulationRounds / delta) + ((simulationRounds % delta) >= first ? 1 : 0);
    const activationCount = occurrences * count;
    total += activationCount;
    logger.debugLow({ count, first, delta, occurrences, activationCount, total });
  }
  // 955312032
  logger.success(total);
}

function main() {
  const { data, logger, part } = new EcArgParser(import.meta.url);
  const grid = new Grid(data.split('\n').map((line) => line.split('').map((value) => value === '#')), CoordSystem.Xy, (cell) => cell ? '#' : '.');
  logger.debugLow(grid);
  if (part === 1) part1(grid, logger.makeChild('part1'));
  if (part === 2) part2(grid, logger.makeChild('part2'));
  if (part === 3) part3(grid, logger.makeChild('part3'));
}

main();
