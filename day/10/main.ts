import { parseArgs } from '@/lib/args.0.ts';
import { BinaryHeap } from '@/lib/binary-heap.0.ts';
import { CoordSystem, Grid } from '@/lib/grid.0.ts';
import { HashedSet } from '@/lib/hashed-set.0.ts';
import { Logger } from '@/lib/logger.0.ts';
import { Point2D, Point2DLike } from '@/lib/point2d.0.ts';

const knightOffsets: Point2DLike[] = [
  { x: -1, y: 2 },
  { x: 1, y: 2 },
  { x: -1, y: -2 },
  { x: 1, y: -2 },
  { x: 2, y: -1 },
  { x: 2, y: 1 },
  { x: -2, y: -1 },
  { x: -2, y: 1 },
];

function part1(data: string, logger: Logger) {
  const grid = new Grid(data.split('\n').map((line) => line.split('')), CoordSystem.Xy);
  logger.debugLow(grid);
  const dragon = grid.find((value) => value === 'D');
  logger.debugLow(dragon);
  if (!dragon) throw new Error('could not find dragon');

  const moves = 4;

  let currentPositions = new HashedSet(Point2D.hash);
  let nextPositions = new HashedSet(Point2D.hash);
  const visited = new HashedSet(Point2D.hash);

  currentPositions.add(dragon);

  for (let m = 0; m < moves; ++m) {
    // logger.debugLow(grid);
    for (const currentPosition of currentPositions) {
      for (const offset of knightOffsets) {
        const nextPosition = Point2D.add(currentPosition, offset);
        if (!grid.inBounds(nextPosition) || visited.has(nextPosition)) continue;
        nextPositions.add(nextPosition);
        visited.add(nextPosition);
      }
    }
    [currentPositions, nextPositions] = [nextPositions, currentPositions];
    nextPositions.clear();
  }
  // for (const currentPosition of currentPositions) grid.cellSet(currentPosition, 'X');
  // logger.debugLow(grid);
  const grid2 = new Grid(grid);
  grid2.fill('.');
  for (const position of visited) if (grid.cellAt(position) === 'S') grid2.cellSet(position, 'X');
  logger.debugLow(grid2);
  const murders = [...visited].filter((position) => grid.cellAt(position) === 'S').length;
  // 164
  logger.success('murders', murders);
}

function part2(data: string, logger: Logger) {
  const moves = 20;
  const grid = new Grid(data.split('\n').map((line) => line.split('')), CoordSystem.Xy);
  let currentDragons = new HashedSet<Point2DLike, number>(Point2D.hash, grid.findAll((value) => value === 'D'));
  let nextDragons = new HashedSet(Point2D.hash);
  // yes, i know
  let currentSheeps = new HashedSet<Point2DLike, number>(Point2D.hash, grid.findAll((value) => value === 'S'));
  const nextSheeps = new HashedSet(Point2D.hash);
  const shelters = new HashedSet<Point2DLike, number>(Point2D.hash, grid.findAll((value) => value === '#'));

  let murders = 0;
  let escapes = 0;

  for (let m = 0; m < moves; ++m) {
    let turnEscapes = 0;
    for (const currentDragon of currentDragons) {
      for (const offset of knightOffsets) {
        const nextDragon = Point2D.add(currentDragon, offset);
        if (!grid.inBounds(nextDragon)) continue;
        nextDragons.add(nextDragon);
      }
    }

    const currentMurderedSheeps = currentSheeps.difference(shelters).intersection(nextDragons);
    const currentTurnMurders = currentMurderedSheeps.size;
    currentSheeps = currentSheeps.difference(currentMurderedSheeps);

    for (const currentSheep of currentSheeps) {
      const nextSheep = Point2D.add(currentSheep, { x: 0, y: -1 });
      if (!grid.inBounds(nextSheep)) ++turnEscapes;
      else nextSheeps.add(nextSheep);
    }

    const nextMurderedSheeps = nextSheeps.difference(shelters).intersection(nextDragons);
    const nextTurnMurders = nextMurderedSheeps.size;

    [currentDragons, nextDragons] = [nextDragons, currentDragons];
    currentSheeps = nextSheeps.difference(nextMurderedSheeps);
    nextDragons.clear();
    nextSheeps.clear();

    const turnMurders = currentTurnMurders + nextTurnMurders;
    murders += turnMurders;
    escapes += turnEscapes;

    logger.debugLow({ m, currentTurnMurders, nextTurnMurders, turnMurders, turnEscapes, murders, escapes });
  }
  // 1718
  logger.success('murders', murders);
}

/*
  BUG: passes the easier samples, spins on later

  it's valid for a sheep to remain hidden in shelter and the dragon to move back and forth between two cells forever, so this naive approach can't work

  need an exit condition, but i don't think there is one other than sheeps.size===0. depth limit is arbitrary

  recursive hangs indefinitely

  dfs ooms because there is no effective pruning
*/
function part3(data: string, logger: Logger) {
  const grid = new Grid(data.split('\n').map((line) => line.split('')), CoordSystem.Xy);
  const shelters = new HashedSet(Point2D.hash, grid.findAll((value) => value === '#').map(({ x, y }) => ({ x, y })));
  enum Player {
    Sheep,
    Dragon,
  }
  /*   // literally a magic number
  const limit = 15;

  function count(depth: number, dragon: Point2DLike, sheeps: HashedSet<Point2DLike, number>, player: Player): number {
    if (sheeps.size === 0) return 1;
    if (depth === limit) return 0;
    if (player === Player.Sheep) {
      let played = false;
      let value = 0;
      for (const sheep of sheeps) {
        const next = Point2D.add(sheep, { x: 0, y: -1 });
        if (!grid.inBounds(next)) {
          // invalidate this branch but allow others
          // logger.debugLow('sheep oob');
          played = true;
        } else if (shelters.has(next) || !Point2D.isEqual(next, dragon)) {
          played = true;
          const nextSheeps = sheeps.clone();
          nextSheeps.delete(sheep);
          nextSheeps.add(next);
          value += count(depth + 1, dragon, nextSheeps, Player.Dragon);
        }
      }
      if (!played) value = count(depth + 1, dragon, sheeps, Player.Dragon);
      // logger.debugLow('sheep', { played, value });
      return value;
    } else {
      let value = 0;
      for (const offset of knightOffsets) {
        const next = Point2D.add(dragon, offset);
        if (!grid.inBounds(next)) continue;
        if (sheeps.has(next) && !shelters.has(next)) {
          const nextSheeps = sheeps.clone();
          nextSheeps.delete(next);
          value += count(depth + 1, next, nextSheeps, Player.Sheep);
        } else { value += count(depth + 1, next, sheeps, Player.Sheep); }
      }
      // logger.debugLow('dragon', { dragon, value });
      return value;
    }
  }

  const dragon = grid.find((item) => item === 'D');
  if (!dragon) throw new Error('could not find dragon');
  const combinations = count(
    0,
    { x: dragon.x, y: dragon.y },
    new HashedSet(Point2D.hash, grid.findAll((value) => value === 'S').map(({ x, y }) => ({ x, y }))),
    Player.Sheep,
  );

  logger.success('combinations', combinations);

  */

  interface QueueItem {
    depth: number;
    dragon: Point2DLike;
    player: Player;
    // sheeps: HashedSet<Point2DLike, number>;
    sheeps: Point2DLike[];
  }

  const dragon = grid.find((item) => item === 'D');
  if (!dragon) throw new Error('could not find dragon');

  // const heap = new BinaryHeap<QueueItem>((a, b) => a.depth - b.depth || a.sheeps.size - b.sheeps.size, [
  const heap = new BinaryHeap<QueueItem>((a, b) => a.depth - b.depth || a.sheeps.length - b.sheeps.length, [
    {
      depth: 0,
      dragon: { x: dragon.x, y: dragon.y },
      player: Player.Sheep,
      // sheeps: new HashedSet(Point2D.hash, grid.findAll((item) => item === 'S').map(({ x, y }) => ({ x, y }))),
      sheeps: grid.findAll((item) => item === 'S').map(({ x, y }) => ({ x, y })).toArray(),
    },
  ]);

  let combinations = 0;
  while (heap.length) {
    const item = heap.pop();
    logger.debugLow(item);
    if (!item) break;
    const { depth, dragon, sheeps, player } = item;
    // if (sheeps.size === 0) {
    if (sheeps.length === 0) {
      ++combinations;
      logger.info({ depth, combinations });
    } else if (player === Player.Dragon) {
      for (const offset of knightOffsets) {
        const next = Point2D.add(dragon, offset);
        if (!grid.inBounds(next)) continue;
        // if (sheeps.has(next) && !shelters.has(next)) {
        if (sheeps.find((item) => Point2D.isEqual(item, next)) && !shelters.has(next)) {
          // const nextSheeps = sheeps.clone();
          // nextSheeps.delete(next);
          const nextSheeps = sheeps.filter((item) => !Point2D.isEqual(item, next));
          heap.push({
            depth: depth + 1,
            dragon: next,
            player: Player.Sheep,
            sheeps: nextSheeps,
          });
        } else {
          heap.push({
            depth: depth + 1,
            dragon: next,
            player: Player.Sheep,
            sheeps,
          });
        }
      }
    } else if (player === Player.Sheep) {
      let played = false;
      for (const sheep of sheeps) {
        const next = Point2D.add(sheep, { x: 0, y: -1 });
        logger.debugLow('sheep', { sheep, next });
        if (!grid.inBounds(next)) {
          // invalidate this branch but allow others
          logger.debugLow('sheep oob');
          played = true;
        } else if (shelters.has(next) || !Point2D.isEqual(next, dragon)) {
          played = true;
          // const nextSheeps = sheeps.clone();
          // nextSheeps.delete(sheep);
          // nextSheeps.add(next);
          const nextSheeps = [...sheeps.filter((item) => !Point2D.isEqual(item, sheep)), next];
          heap.push({
            depth: depth + 1,
            dragon,
            player: Player.Dragon,
            sheeps: nextSheeps,
          });
        }
      }
      logger.debugLow('sheep', { played });
      if (!played) heap.push({ depth: depth + 1, dragon, player: Player.Dragon, sheeps });
    }
  }
  logger.success('combinations', combinations);
}

function main() {
  const { data, logger, part } = parseArgs(import.meta.url);
  if (part === 1) part1(data, logger.makeChild('part1'));
  if (part === 2) part2(data, logger.makeChild('part2'));
  if (part === 3) part3(data, logger.makeChild('part3'));
}

main();
