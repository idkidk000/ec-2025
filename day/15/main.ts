import { EcArgParser } from '@/lib/args.1.ts';
import { BinaryHeap } from '@/lib/binary-heap.0.ts';
import { Logger } from '@/lib/logger.0.ts';
import { PackedSet } from '@/lib/packed-set.0.ts';
import { Distance, Offset2D, Point2D, Point2DLike } from '@/lib/point2d.0.ts';
import { Utils } from '@/lib/utils.0.ts';
import { CoordSystem, Grid } from '../../lib/grid.0.ts';
import { setDefaultAutoSelectFamily } from 'node:net';
import { PackedMap } from '../../lib/packed-map.0.ts';

enum Rotation {
  Left = -1,
  Right = 1,
}
enum Direction {
  North,
  East,
  South,
  West,
}
type Vec2D = Point2DLike & { direction: Direction };

function mapWalls(data: string, logger: Logger): { start: Point2DLike; end: Point2DLike; walls: PackedSet<Point2DLike, number> } {
  const instructions = data.split(',').map((token) => {
    const rotate = token[0] === 'L' ? Rotation.Left : Rotation.Right;
    const length = parseInt(token.slice(1));
    return { rotate, length };
  });
  const position: Vec2D = { x: 0, y: 0, direction: Direction.North };
  const start = { ...position };
  const walls = new PackedSet(Point2D.pack32, Point2D.unpack32);
  for (const instruction of instructions) {
    position.direction = Utils.modP(position.direction + instruction.rotate, 4);
    for (let i = 0; i < instruction.length; ++i) {
      if (position.direction === Direction.East) ++position.x;
      else if (position.direction === Direction.West) --position.x;
      else if (position.direction === Direction.North) ++position.y;
      else if (position.direction === Direction.South) --position.y;
      walls.add(position);
    }
    logger.debugLow({ instruction, position });
  }
  const end = { ...position };
  logger.debugLow({ start, end, walls });
  return { start, end, walls };
}

function part1(data: string, logger: Logger) {
  const { start, end, walls } = mapWalls(data, logger);

  const offsets = Point2D.offsets(1, Offset2D.Cardinal);
  const seen = new PackedSet(Point2D.pack32, Point2D.unpack32, [start]);
  const queue = new BinaryHeap<Point2DLike & { length: number }>((a, b) => a.length - b.length, [{
    ...start,
    length: 0,
  }]);
  let best = Infinity;

  while (queue.length) {
    const item = queue.pop();
    if (!item) break;
    if (item.length >= best) continue;
    for (const offset of offsets) {
      const next = Point2D.add(item, offset);
      if (Point2D.isEqual(next, end)) {
        if (item.length + 1 < best) best = item.length + 1;
        logger.info('end', { item, next, best });
      } else if (walls.has(next) || seen.has(next)) continue;
      else {
        seen.add(next);
        queue.push({ ...next, length: item.length + 1 });
      }

      logger.debugLow({ item, next }, queue.length);
    }
  }
  // 100
  logger.success('best', best);
}

function part2(data: string, logger: Logger) {
  part1(data, logger);
  // 4405
}

// BUG: eventually throws `RangeError: Map maximum size exceeded` because i'm adding too much nonsense to the queue
function part3(data: string, logger: Logger) {
  const instructions = data.split(',').map((token) => {
    const rotate = token[0] === 'L' ? Rotation.Left : Rotation.Right;
    const length = parseInt(token.slice(1));
    return { rotate, length };
  });
  let position: Vec2D = { x: 0, y: 0, direction: Direction.North };
  let nextPosition: Vec2D = { ...position };
  const start = { ...position };
  const walls: { a: Point2DLike; b: Point2DLike }[] = [];
  for (const instruction of instructions) {
    nextPosition = {
      ...position,
      direction: Utils.modP(position.direction + instruction.rotate, 4),
    };
    if (nextPosition.direction === Direction.North) nextPosition.y += instruction.length;
    else if (nextPosition.direction === Direction.East) nextPosition.x += instruction.length;
    else if (nextPosition.direction === Direction.South) nextPosition.y -= instruction.length;
    else if (nextPosition.direction === Direction.West) nextPosition.x -= instruction.length;
    walls.push({ a: { x: position.x, y: position.y }, b: { x: nextPosition.x, y: nextPosition.y } });

    logger.debugLow({ instruction, position, nextPosition });
    position = { ...nextPosition };
  }
  const end = { ...position };
  // FIXME: jank
  if (walls[0].a.x > walls[0].b.x) --walls[0].a.x;
  else if (walls[0].a.x < walls[0].b.x) ++walls[0].a.x;
  else if (walls[0].a.y > walls[0].b.y) --walls[0].a.y;
  else if (walls[0].a.y < walls[0].b.y) ++walls[0].a.y;
  if (walls[walls.length - 1].a.x > walls[walls.length - 1].b.x) ++walls[walls.length - 1].b.x;
  else if (walls[walls.length - 1].a.x < walls[walls.length - 1].b.x) --walls[walls.length - 1].b.x;
  else if (walls[walls.length - 1].a.y > walls[walls.length - 1].b.y) ++walls[walls.length - 1].b.y;
  else if (walls[walls.length - 1].a.y < walls[walls.length - 1].b.y) --walls[walls.length - 1].b.y;

  logger.debugLow({ instructions, walls });

  // const seen = new PackedSet(Point2D.pack32, Point2D.unpack32, [start]);
  const seen = new PackedMap(Point2D.pack32, Point2D.unpack32, [[start, 0]]);
  const queue = new BinaryHeap<Point2DLike & { length: number; path: Point2DLike[]; steps: number }>(
    (a, b) => a.steps - b.steps || Point2D.distance(a, end, Distance.Hypot2) - Point2D.distance(b, end, Distance.Hypot2) || a.length - b.length,
    [{
      x: start.x,
      y: start.y,
      length: 0,
      path: [],
      steps: 0,
    }],
  );
  let best = Infinity;
  const wallXs = [...new Set(walls.flatMap((wall) => [wall.a.x, wall.b.x]).toSorted((a, b) => a - b))];
  const wallYs = [...new Set(walls.flatMap((wall) => [wall.a.y, wall.b.y]).toSorted((a, b) => a - b))];
  const offsets = Point2D.offsets(1, Offset2D.Cardinal);

  const bounds = Point2D.getBounds(walls.flatMap(({ a, b }) => [a, b]));
  const inBounds = Point2D.makeInBounds(bounds);
  // const grid = new Grid({ rows: bounds.maxY - bounds.minY + 1, cols: bounds.maxX - bounds.minX + 1, fill: '.' }, CoordSystem.Xy);
  // grid.cellSet({ x: start.x - bounds.minX, y: start.y - bounds.minY }, 'S');
  // grid.cellSet({ x: end.x - bounds.minX, y: end.y - bounds.minY }, 'E');
  // for (const wall of walls) {
  //   if (wall.a.x === wall.b.x) {
  //     for (let y = Math.min(wall.a.y, wall.b.y); y <= Math.max(wall.a.y, wall.b.y); ++y) grid.cellSet({ x: wall.a.x - bounds.minX, y: y - bounds.minY }, '#');
  //   } else {for (let x = Math.min(wall.a.x, wall.b.x); x <= Math.max(wall.a.x, wall.b.x); ++x)
  //       grid.cellSet({ x: x - bounds.minX, y: wall.a.y - bounds.minY }, '#');}
  // }
  // logger.info(grid);

  logger.debugLow({ wallXs, wallYs });
  let smallestD2 = Infinity;

  let wallFilterTime = 0;
  let wallIntersectTime = 0;

  while (queue.length) {
    const item = queue.pop();
    if (!item) break;
    if (item.length >= best) continue;
    const d2 = Point2D.distance(item, end, Distance.Hypot2);
    if (d2 < smallestD2) {
      smallestD2 = d2;
      logger.info({ closest: Math.sqrt(d2), qlen: queue.length, wallFilterTime, wallIntersectTime }, item);
    }
    // FIXME: vile and adding **FARRRRR** too many extra positions
    const wfStart = performance.now();
    const nextEast = wallXs.filter((x) => x > item.x).reduce((acc, x) => Math.min(acc, x), Infinity);
    const nextWest = wallXs.filter((x) => x < item.x).reduce((acc, x) => Math.max(acc, x), -Infinity);
    const nextNorth = wallYs.filter((y) => y > item.y).reduce((acc, y) => Math.min(acc, y), Infinity);
    const nextSouth = wallYs.filter((y) => y < item.y).reduce((acc, y) => Math.max(acc, y), -Infinity);
    wallFilterTime += performance.now() - wfStart;
    //FIXME: this is really innefficient and extremely jank
    const nextPositions = [
      ...offsets.map((offset) => Point2D.add(offset, item)),
      { y: item.y, x: nextEast - 1 },
      // { y: item.y, x: nextEast },
      // { y: item.y, x: nextEast + 1 },
      // { y: item.y, x: nextWest - 1 },
      // { y: item.y, x: nextWest },
      { y: item.y, x: nextWest + 1 },
      { x: item.x, y: nextNorth - 1 },
      // { x: item.x, y: nextNorth },
      // { x: item.x, y: nextNorth + 1 },
      // { x: item.x, y: nextSouth - 1 },
      // { x: item.x, y: nextSouth },
      { x: item.x, y: nextSouth + 1 },
    ].filter(({ x, y }) => x !== Infinity && x !== -Infinity && y !== Infinity && y !== -Infinity && (x !== item.x || y !== item.y));
    logger.debugMed({ item, nextPositions }, queue.length);
    for (const next of nextPositions) {
      if (!inBounds(next)) continue;
      const nextLength = item.length + Point2D.distance(item, next, Distance.Sum);
      // if (seen.has(next)) continue;
      if (!Point2D.isEqual(next, end) && (seen.get(next) ?? Infinity) <= nextLength) continue;
      seen.set(next, nextLength);

      const wiStart = performance.now();
      // FIXME: this is really innefficient
      const intersections = walls.filter((wall) => {
        // next path section is vertical
        if (next.x === item.x) {
          // wall is horizontal
          return wall.a.y === wall.b.y &&
            Math.min(wall.a.x, wall.b.x) <= next.x &&
            Math.max(wall.a.x, wall.b.x) >= next.x &&
            wall.a.y >= Math.min(next.y, item.y) &&
            wall.a.y <= Math.max(next.y, item.y);
          // next path is horizontal
        } else {
          // wall is vertical
          return wall.a.x === wall.b.x &&
            Math.min(wall.a.y, wall.b.y) <= next.y &&
            Math.max(wall.a.y, wall.b.y) >= next.y &&
            wall.a.x >= Math.min(next.x, item.x) &&
            wall.a.x <= Math.max(next.x, item.x);
        }
      });
      wallIntersectTime += performance.now() - wiStart;
      if (intersections.length) continue;
      if (Point2D.isEqual(next, end)) {
        if (nextLength < best) best = nextLength;
        const path = [...item.path, { x: item.x, y: item.y }, next];
        logger.info('end', { qlen: queue.length, length: nextLength, path, best });
        // for (const { x, y } of path) grid.cellSet({ x: x - bounds.minX, y: y - bounds.minY }, '^');
        // logger.info(grid);
        // return;
      } else {
        // seen.add(next);
        queue.push({ ...next, length: nextLength, path: [...item.path, { x: item.x, y: item.y }], steps: item.steps + 1 });
      }

      // logger.debugLow({ item, next, nextLength }, queue.length);
    }
  }
  logger.info({ wallFilterTime, wallIntersectTime });
  logger.success('best', best);
}

function main() {
  const { data, logger, part } = new EcArgParser(import.meta.url);
  if (part === 1) part1(data, logger.makeChild('part1'));
  if (part === 2) part2(data, logger.makeChild('part2'));
  if (part === 3) part3(data, logger.makeChild('part3'));
}

main();
