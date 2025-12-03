import { parseArgs } from '@/lib/args.0.ts';
import { CoordSystem, Grid } from '@/lib/grid.0.ts';
import { HashedSet } from '@/lib/hashed-set.0.ts';
import { Logger } from '@/lib/logger.0.ts';
import { Point2D, Point2DLike } from '@/lib/point2d.0.ts';

const dragonOffsets: Point2DLike[] = [
  { x: -1, y: 2 },
  { x: 1, y: 2 },
  { x: -1, y: -2 },
  { x: 1, y: -2 },
  { x: 2, y: -1 },
  { x: 2, y: 1 },
  { x: -2, y: -1 },
  { x: -2, y: 1 },
];

function part1(grid: Grid<string, CoordSystem.Xy>, dragon: Point2DLike, logger: Logger) {
  const moves = 4;
  let currentPositions = new HashedSet(Point2D.hash, [dragon]);
  let nextPositions = new HashedSet(Point2D.hash);
  const visited = new HashedSet(Point2D.hash);

  for (let m = 0; m < moves; ++m) {
    for (const currentPosition of currentPositions) {
      for (const offset of dragonOffsets) {
        const nextPosition = Point2D.add(currentPosition, offset);
        if (!grid.inBounds(nextPosition) || visited.has(nextPosition)) continue;
        nextPositions.add(nextPosition);
        visited.add(nextPosition);
      }
    }
    [currentPositions, nextPositions] = [nextPositions, currentPositions];
    nextPositions.clear();
  }

  const murders = [...visited].filter((position) => grid.cellAt(position) === 'S').length;
  // 164
  logger.success('murders', murders);
}

function part2(grid: Grid<string, CoordSystem.Xy>, dragon: Point2DLike, logger: Logger) {
  const moves = 20;
  let currentDragons = new HashedSet(Point2D.hash, [dragon]);
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
      for (const offset of dragonOffsets) {
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

function part3(grid: Grid<string, CoordSystem.Xy>, dragon: Point2DLike, logger: Logger) {
  const shelters = new HashedSet(Point2D.hash, grid.findAll((value) => value === '#').map(({ x, y }) => ({ x, y })));
  enum Player {
    Sheep,
    Dragon,
  }
  const cache = new Map<string, number>();
  function count(dragon: Point2DLike, sheeps: Point2DLike[], player: Player): number {
    if (sheeps.length === 0) return 1;
    //FIXME: horrendous actually
    const key = `${player}|${dragon.x}|${dragon.y}|${sheeps.toSorted((a, b) => a.x - b.x).map(({ x, y }) => `${x},${y}`).join('|')}`;
    const cached = cache.get(key);
    if (typeof cached === 'number') return cached;
    let value = 0;
    if (player === Player.Sheep) {
      let played = false;
      for (const [s, sheep] of sheeps.entries()) {
        const next = Point2D.add(sheep, { x: 0, y: -1 });
        if (!grid.inBounds(next)) {
          // invalidate this branch but allow others
          played = true;
        } else if (shelters.has(next) || !Point2D.isEqual(next, dragon)) {
          played = true;
          const nextSheeps = [...sheeps];
          nextSheeps[s] = next;
          value += count(dragon, nextSheeps, Player.Dragon);
        }
      }
      if (!played) value = count(dragon, sheeps, Player.Dragon);
      logger.debugMed('sheep', { played, value });
    }
    if (player === Player.Dragon) {
      for (const offset of dragonOffsets) {
        const next = Point2D.add(dragon, offset);
        if (!grid.inBounds(next)) continue;
        const sheepIx = sheeps.findIndex((item) => Point2D.isEqual(item, next));
        if (sheepIx > -1 && !shelters.has(next)) value += count(next, sheeps.toSpliced(sheepIx, 1), Player.Sheep);
        else value += count(next, sheeps, Player.Sheep);
      }
      logger.debugMed('dragon', { dragon, value });
    }
    cache.set(key, value);
    return value;
  }

  if (!dragon) throw new Error('could not find dragon');

  const combinations = count(dragon, grid.findAll((value) => value === 'S').toArray(), Player.Sheep);
  // 19627959412631
  logger.success('combinations', combinations);
}

function main() {
  const { data, logger, part } = parseArgs(import.meta.url);
  const grid = new Grid(data.split('\n').map((line) => line.split('')), CoordSystem.Xy);
  const dragon = grid.find((item) => item === 'D');
  if (!dragon) throw new Error('could not find dragon');
  if (part === 1) part1(grid, dragon, logger.makeChild('part1'));
  if (part === 2) part2(grid, dragon, logger.makeChild('part2'));
  if (part === 3) part3(grid, dragon, logger.makeChild('part3'));
}

main();
