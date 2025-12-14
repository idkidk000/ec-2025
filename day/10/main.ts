import { EcArgParser } from '@/lib/args.1.ts';
import { CoordSystem, Grid } from '@/lib/grid.0.ts';
import { Logger } from '@/lib/logger.0.ts';
import { PackedSet } from '@/lib/packed-set.0.ts';
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
  let currentPositions = new PackedSet(Point2D.hash, Point2D.unpack32, [dragon]);
  let nextPositions = new PackedSet(Point2D.hash, Point2D.unpack32);
  const visited = new PackedSet(Point2D.hash, Point2D.unpack32);

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
  let currentDragons = new PackedSet(Point2D.pack32, Point2D.unpack32, [dragon]);
  let nextDragons = new PackedSet(Point2D.pack32, Point2D.unpack32);
  // yes, i know
  let currentSheeps = new PackedSet<Point2DLike, number>(Point2D.pack32, Point2D.unpack32, grid.findAll((value) => value === 'S'));
  const nextSheeps = new PackedSet(Point2D.pack32, Point2D.unpack32);
  const shelters = new PackedSet<Point2DLike, number>(Point2D.pack32, Point2D.unpack32, grid.findAll((value) => value === '#'));

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
  enum Player {
    Sheep,
    Dragon,
  }
  const cache = new Map<number, number>();
  const u8 = new Uint8Array(8);
  const f64 = new Float64Array(u8.buffer);

  function count(dragon: Point2DLike, sheeps: Point2DLike[], player: Player): number {
    if (sheeps.length === 0) return 1;
    // key is deterministic without sorting provided that replacement values are spliced
    // handling >6 sheep would require more effort
    u8[0] = sheeps.length > 0 ? ((sheeps[0].x << 4) | sheeps[0].y) : 0;
    u8[1] = sheeps.length > 1 ? ((sheeps[1].x << 4) | sheeps[1].y) : 0;
    u8[2] = sheeps.length > 2 ? ((sheeps[2].x << 4) | sheeps[2].y) : 0;
    u8[3] = sheeps.length > 3 ? ((sheeps[3].x << 4) | sheeps[3].y) : 0;
    u8[4] = sheeps.length > 4 ? ((sheeps[4].x << 4) | sheeps[4].y) : 0;
    u8[5] = sheeps.length > 5 ? ((sheeps[5].x << 4) | sheeps[5].y) : 0;
    u8[6] = (dragon.x << 4) | dragon.y;
    u8[7] = player;
    // reading this as f64 is fine as long as bit 6 of u8[7] remains off
    const [key] = f64;
    logger.debugMed({ u8, key });
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
        } else if (!Point2D.isEqual(next, dragon) || grid.cellAt(next) === '#') {
          played = true;
          value += count(dragon, sheeps.toSpliced(s, 1, next), Player.Dragon);
        }
      }
      if (!played) value = count(dragon, sheeps, Player.Dragon);
      logger.debugMed('sheep', { played, value });
    } else if (player === Player.Dragon) {
      for (const offset of dragonOffsets) {
        const next = Point2D.add(dragon, offset);
        if (!grid.inBounds(next)) continue;
        const s = sheeps.findIndex((item) => Point2D.isEqual(item, next));
        if (s > -1 && grid.cellAt(next) !== '#') value += count(next, sheeps.toSpliced(s, 1), Player.Sheep);
        else value += count(next, sheeps, Player.Sheep);
      }
      logger.debugMed('dragon', { dragon, value });
    }
    cache.set(key, value);
    return value;
  }

  const combinations = count(dragon, grid.findAll((value) => value === 'S').toArray(), Player.Sheep);
  // 19627959412631
  logger.success('combinations', combinations);
}

function main() {
  const { data, logger, part } = new EcArgParser(import.meta.url);
  const grid = new Grid(data.split('\n').map((line) => line.split('')), CoordSystem.Xy);
  const dragon = grid.find((item) => item === 'D');
  if (!dragon) throw new Error('could not find dragon');
  if (part === 1) part1(grid, dragon, logger.makeChild('part1'));
  if (part === 2) part2(grid, dragon, logger.makeChild('part2'));
  if (part === 3) part3(grid, dragon, logger.makeChild('part3'));
}

main();
