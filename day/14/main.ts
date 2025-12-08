import { EcArgParser } from '@/lib/args.1.ts';
import { CoordSystem, Grid } from '@/lib/grid.0.ts';
import { ansiStyles, Logger } from '@/lib/logger.0.ts';
import { PackedMap } from '@/lib/packed-map.0.ts';
import { PackedSet } from '@/lib/packed-set.0.ts';
import { Offset2D, Point2D, Point2DLike } from '@/lib/point2d.0.ts';

function part1(grid: Grid<boolean, CoordSystem.Xy>, logger: Logger) {
  const nextState = new PackedMap<Point2DLike, boolean, number>(Point2D.pack32, Point2D.unpack32);
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
  let active = new PackedSet(Point2D.pack32, Point2D.unpack32, grid.cellEntries().filter(([, value]) => value).map(([point]) => point));
  let nextActive = new PackedSet(Point2D.pack32, Point2D.unpack32);
  const offsets = Point2D.offsets(1, Offset2D.Diagonal);

  let totalActivations = 0;
  for (let round = 0; round < 2025; ++round) {
    for (const [point] of grid.cellEntries()) {
      const activeNeighbours = offsets
        .map((offset) => Point2D.add(point, offset))
        .filter((neighbour) => grid.inBounds(neighbour) && active.has(neighbour))
        .length;
      const shouldActivate = activeNeighbours % 2 === (active.has(point) ? 1 : 0);
      logger.debugMed({ point, active, activeNeighbours, nextActive });
      if (shouldActivate) nextActive.add(point);
    }
    totalActivations += nextActive.size;
    logger.debugLow({ round, activations: nextActive.size, totalActivations });
    [active, nextActive] = [nextActive, active];
    nextActive.clear();
  }

  // 1170941
  logger.success(totalActivations);
}

function part3(grid: Grid<boolean, CoordSystem.Xy>, logger: Logger) {
  const size = 34;
  const simulationRounds = 1_000_000_000;
  // only run the top half of the sim since it's symmetrical
  // could probably just run one side and use `Number` instead of `Big(Ui|I)nt`
  let sim = new BigUint64Array(size / 2);
  let nextSim = new BigUint64Array(size / 2);
  const simMask = (1n << BigInt(size)) - 1n;
  const target = new BigUint64Array(grid.rows / 2);
  const targetXOffset = size / 2 - grid.cols / 2;
  const targetYOffset = size / 2 - grid.rows / 2;
  const readable = (value: bigint) => value.toString(2).replaceAll('0', '.').replaceAll('1', '#').padStart(size, '.').slice(0, size / 2);
  for (let i = 0; i < target.length; ++i) {
    const row = grid.rowAt(i);
    if (!row) break;
    target[i] = 0n;
    for (let j = 0; j < row.length; ++j) if (row[j]) target[i] |= 1n << BigInt(targetXOffset + j);
  }
  const targetMask = ((1n << BigInt(grid.cols)) - 1n) << BigInt(targetXOffset);

  const activations = new Map<number, number[]>();
  // simulate until each activation pattern has two occurrences
  for (let round = 0; true; ++round) {
    let match = true;
    for (let i = 0; i < sim.length; ++i) {
      const row = sim[i];
      const prev = i === 0 ? 0n : sim[i - 1];
      const next = i === sim.length - 1 ? row : sim[i + 1];
      // logger.debugMed({ prev, row, next });
      nextSim[i] = (((prev << 1n) ^ (prev >> 1n) ^ row ^ (next << 1n) ^ (next >> 1n)) & simMask) ^ simMask;
      if (i >= targetYOffset && match && (nextSim[i] & targetMask) !== target[i - targetYOffset]) match = false;
    }
    if (match) {
      let count = 0;
      for (const row of nextSim) for (let i = 0n; row && i < BigInt(size); ++i) if ((row >> i) & 1n) count += 2;
      if (activations.has(count)) activations.get(count)?.push(round);
      else activations.set(count, [round]);
      // `TypedArray.prototype.map()` can only create a new typed array of the same subclass
      logger.debugMed(ansiStyles.clear, 'match', { round, count }, `\n${Array.prototype.map.bind(nextSim)(readable).join('\n')}`);
      if (activations.values().every((item) => item.length > 1)) break;
    }
    [sim, nextSim] = [nextSim, sim];
  }
  logger.debugLow(activations);

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
