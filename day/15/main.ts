import { EcArgParser } from '@/lib/args.1.ts';
import { BinaryHeap } from '@/lib/binary-heap.0.ts';
import { HashedSet } from '@/lib/hashed-set.0.ts';
import { Logger } from '@/lib/logger.0.ts';
import { PackedSet } from '@/lib/packed-set.0.ts';
import { Offset2D, Point2D, Point2DLike } from '@/lib/point2d.0.ts';
import { Utils } from '@/lib/utils.0.ts';

enum Rotation {
  Left = -1,
  Right = 1,
}
enum Heading {
  North,
  East,
  South,
  West,
}
type Vec2D = Point2DLike & { heading: Heading };

function mapWalls(data: string, logger: Logger): { start: Point2DLike; end: Point2DLike; walls: PackedSet<Point2DLike, number> } {
  const instructions = data.split(',').map((token) => {
    const rotate = token[0] === 'L' ? Rotation.Left : Rotation.Right;
    const length = parseInt(token.slice(1));
    return { rotate, length };
  });
  const position: Vec2D = { x: 0, y: 0, heading: Heading.North };
  const start = { ...position };
  const walls = new PackedSet(Point2D.pack32, Point2D.unpack32);
  for (const instruction of instructions) {
    position.heading = Utils.modP(position.heading + instruction.rotate, 4);
    for (let i = 0; i < instruction.length; ++i) {
      if (position.heading === Heading.East) ++position.x;
      else if (position.heading === Heading.West) --position.x;
      else if (position.heading === Heading.North) ++position.y;
      else if (position.heading === Heading.South) --position.y;
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
  const queue = new BinaryHeap<Point2DLike & { cost: number }>((a, b) => a.cost - b.cost, [{
    ...start,
    cost: 0,
  }]);
  let best = Infinity;

  while (queue.length) {
    const item = queue.pop();
    if (!item) break;
    if (item.cost >= best) continue;
    for (const offset of offsets) {
      const next = Point2D.add(item, offset);
      if (Point2D.isEqual(next, end)) {
        if (item.cost + 1 < best) best = item.cost + 1;
        logger.info('end', { item, next, best });
      } else if (walls.has(next) || seen.has(next)) continue;
      else {
        seen.add(next);
        queue.push({ ...next, cost: item.cost + 1 });
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

function part3(data: string, logger: Logger) {
  const instructions = data.split(',').map((token) => {
    const rotate = token[0] === 'L' ? Rotation.Left : Rotation.Right;
    const length = parseInt(token.slice(1));
    return { rotate, length };
  });
  let position: Vec2D = { x: 0, y: 0, heading: Heading.North };
  let nextPosition: Vec2D = { ...position };
  const start = { x: position.x, y: position.y };
  const walls: { from: Point2DLike; to: Point2DLike }[] = [];
  for (const instruction of instructions) {
    nextPosition = {
      ...position,
      heading: Utils.modP(position.heading + instruction.rotate, 4),
    };
    if (nextPosition.heading === Heading.North) nextPosition.y += instruction.length;
    else if (nextPosition.heading === Heading.East) nextPosition.x += instruction.length;
    else if (nextPosition.heading === Heading.South) nextPosition.y -= instruction.length;
    else if (nextPosition.heading === Heading.West) nextPosition.x -= instruction.length;
    walls.push({
      from: { x: position.x, y: position.y },
      to: { x: nextPosition.x, y: nextPosition.y },
    });
    position = { ...nextPosition };
  }
  const end = { x: position.x, y: position.y };
  if (walls[0].from.x > walls[0].to.x) --walls[0].from.x;
  else if (walls[0].from.x < walls[0].to.x) ++walls[0].from.x;
  else if (walls[0].from.y > walls[0].to.y) --walls[0].from.y;
  else if (walls[0].from.y < walls[0].to.y) ++walls[0].from.y;
  const lastWall = walls[walls.length - 1];
  if (lastWall.to.x > lastWall.from.x) --lastWall.to.x;
  else if (lastWall.to.x < lastWall.from.x) ++lastWall.to.x;
  else if (lastWall.to.y > lastWall.from.y) --lastWall.to.y;
  else if (lastWall.to.y < lastWall.from.y) ++lastWall.to.y;
  const Xs = [...new Set([...walls.flatMap((wall) => [wall.from.x, wall.to.x].flatMap((i) => [i - 1, i + 1])), end.x])].toSorted((a, b) => a - b);
  const Ys = [...new Set([...walls.flatMap((wall) => [wall.from.y, wall.to.y].flatMap((i) => [i - 1, i + 1])), end.y])].toSorted((a, b) => a - b);
  logger.debugLow({ walls, start, end, Xs, Ys });

  const queue = new BinaryHeap<Point2DLike & { cost: number; moves: number }>((a, b) => a.cost - b.cost, [{ ...start, cost: 0, moves: 0 }]);

  const seen = new HashedSet(Point2D.hash);
  let cost: number | null = null;

  while (queue.length) {
    const item = queue.pop();
    if (!item || seen.has(item)) continue;
    if (Point2D.isEqual(end, item)) {
      logger.info('found', item);
      cost = item.cost;
      break;
    }
    // if (item.moves > 3) continue;
    seen.add(item);
    logger.debugLow(item, queue.length);
    let northLimit = Infinity;
    let eastLimit = Infinity;
    let southLimit = -Infinity;
    let westLimit = -Infinity;
    for (const wall of walls) {
      const [minY, maxY] = wall.from.y < wall.to.y ? [wall.from.y, wall.to.y] : [wall.to.y, wall.from.y];
      const [minX, maxX] = wall.from.x < wall.to.x ? [wall.from.x, wall.to.x] : [wall.to.x, wall.from.x];
      // vertical
      if (wall.from.x === wall.to.x) {
        // above or below
        if (wall.from.x === item.x) {
          if (minY > item.y) northLimit = Math.min(northLimit, minY);
          else if (maxY < item.y) southLimit = Math.max(southLimit, maxY);
        }
        // possible intersect
        if (minY <= item.y && maxY >= item.y) {
          if (wall.from.x < item.x) westLimit = Math.max(westLimit, wall.from.x);
          else if (wall.from.x > item.x) eastLimit = Math.min(eastLimit, wall.from.x);
        }
        // horizontal
      } else if (wall.from.y === wall.to.y) {
        // beside
        if (wall.from.y === item.y) {
          if (maxX > item.x) eastLimit = Math.min(eastLimit, minX);
          else if (maxX < item.x) westLimit = Math.max(westLimit, maxX);
        }
        // possible intersect
        if (minX <= item.x && maxX >= item.x) {
          if (wall.from.y < item.y) southLimit = Math.max(southLimit, wall.from.y);
          else if (wall.from.y > item.y) northLimit = Math.min(northLimit, wall.from.y);
        }
      }
    }
    logger.debugLow({ northLimit, eastLimit, southLimit, westLimit });

    for (const x of Xs.filter((x) => x > westLimit && x < eastLimit)) {
      const nextItem = {
        cost: item.cost + Math.abs(x - item.x),
        moves: item.moves + 1,
        x,
        y: item.y,
      };
      logger.debugLow('push', nextItem);
      queue.push(nextItem);
    }
    for (const y of Ys.filter((y) => y > southLimit && y < northLimit)) {
      const nextItem = {
        cost: item.cost + Math.abs(y - item.y),
        moves: item.moves + 1,
        x: item.x,
        y,
      };
      logger.debugLow('push', nextItem);
      queue.push(nextItem);
    }
  }
  if (cost === null) throw new Error('no path found');
  // 466532343
  else logger.success('cost', cost);
}

function main() {
  const { data, logger, part } = new EcArgParser(import.meta.url);
  if (part === 1) part1(data, logger.makeChild('part1'));
  if (part === 2) part2(data, logger.makeChild('part2'));
  if (part === 3) part3(data, logger.makeChild('part3'));
}

main();
