import { EcArgParser } from '@/lib/args.1.ts';
import { Deque } from '@/lib/deque.0.ts';
import { CoordSystem, Grid } from '@/lib/grid.0.ts';
import { Logger } from '@/lib/logger.0.ts';
import { PackedSet } from '@/lib/packed-set.0.ts';
import { Offset2D, Point2D, Point2DLike } from '@/lib/point2d.0.ts';
import { Utils } from '@/lib/utils.0.ts';

function part1(data: string, logger: Logger) {
  const grid = new Grid(data.split('\n').map((line) => line.split('')), CoordSystem.Xy);
  logger.debugLow(grid);
  const offsets: Point2DLike[] = [
    { x: 1, y: 0 },
    { x: 0, y: 1 },
  ];
  const centerX = Math.floor(grid.cols / 2);
  let pairs = 0;
  for (const cell of grid.findAll((value) => value === 'T')) {
    for (const offset of offsets) {
      if (offset.y === 1 && Utils.modP(centerX - cell.x, 2) !== cell.y % 2) continue;
      const neighbour = Point2D.add(cell, offset);
      if (grid.inBounds(neighbour) && grid.cellAt(neighbour) === 'T') {
        if (neighbour.y === cell.y) logger.debugLow('row', cell, neighbour);
        else logger.debugLow('edge', cell, neighbour);
        ++pairs;
      }
    }
  }
  // 135
  logger.success(pairs);
}

function part2(data: string, logger: Logger) {
  const grid = new Grid(data.split('\n').map((line) => line.split('')), CoordSystem.Xy);
  const start = grid.find((value) => value === 'S');
  const end = grid.find((value) => value === 'E');
  logger.debugLow({ start, end });
  if (!start || !end) throw new Error('oh no');
  const seen = new PackedSet(Point2D.pack32, Point2D.unpack32, [start]);
  interface QueueItem extends Point2DLike {
    jumps: number;
  }
  const queue = new Deque<QueueItem>([{ x: start.x, y: start.y, jumps: 0 }]);
  const offsets = Point2D.offsets(1, Offset2D.Cardinal);
  let best = Infinity;
  const centerX = Math.floor(grid.cols / 2);
  while (queue.size && best === Infinity) {
    const item = queue.popFront();
    if (!item) throw new Error('oh no');
    for (const offset of offsets) {
      if (offset.y !== 0) {
        const idk = Utils.modP(centerX - item.x, 2);
        if (offset.y === -1 && idk === item.y % 2) continue;
        if (offset.y === 1 && idk !== item.y % 2) continue;
      }
      const nextItem = { ...Point2D.add(item, offset), jumps: item.jumps + 1 };
      if (!grid.inBounds(nextItem)) continue;
      const value = grid.cellAt(nextItem);
      if (value === 'E') {
        logger.debugLow('finished', nextItem);
        best = nextItem.jumps;
        break;
      }
      if (value !== 'T') continue;
      if (seen.has(nextItem)) continue;
      seen.add(nextItem);
      queue.pushBack(nextItem);
    }
  }
  // 577
  logger.success(best);
}

function part3(data: string, logger: Logger) {
  const grid = new Grid(data.split('\n').map((line) => line.split('')), CoordSystem.Xy);
  const start = grid.find((value) => value === 'S');
  const end = grid.find((value) => value === 'E');
  logger.debugLow({ start, end });
  if (!start || !end) throw new Error('oh no');
  const seen = new PackedSet(Point2D.pack32, Point2D.unpack32, [start]);
  interface QueueItem extends Point2DLike {
    jumps: number;
  }
  const queue = new Deque<QueueItem>([{ x: start.x, y: start.y, jumps: 0 }]);
  // we can jump in place
  const offsets = [{ x: 0, y: 0 }, ...Point2D.offsets(1, Offset2D.Cardinal)];
  logger.info(grid);
  let best = Infinity;
  // equilateral so this is a constant
  const centerX = Math.floor(grid.cols / 2);

  function rotate(point: Point2DLike, value: number): Point2DLike {
    const result = { ...point };
    for (let i = 0; i < value % 3; ++i) {
      //TODO: the rest of the owl
    }
    return result;
  }

  while (queue.size && best === Infinity) {
    const item = queue.popFront();
    if (!item) throw new Error('oh no');
    for (const offset of offsets) {
      // TODO: this may need patching
      if (offset.y !== 0) {
        const idk = Utils.modP(centerX - item.x, 2);
        if (offset.y === -1 && idk === item.y % 2) continue;
        if (offset.y === 1 && idk !== item.y % 2) continue;
      }
      const nextItem = { ...Point2D.add(item, offset), jumps: item.jumps + 1 };
      if (!grid.inBounds(nextItem)) continue;
      const value = grid.cellAt(rotate(nextItem, nextItem.jumps % 3));
      if (value === 'E') {
        logger.debugLow('finished', nextItem);
        best = nextItem.jumps;
        break;
      }
      if (value !== 'T') continue;
      if (seen.has(nextItem)) continue;
      seen.add(nextItem);
      queue.pushBack(nextItem);
    }
  }

  logger.success(best);
}

/** no part4 - i'm figuring out coord rotation */
function part4(data: string, logger: Logger) {
  const [one, two] = data.split('\n\n').map((section) => new Grid(section.split('\n').map((line) => line.split('')), CoordSystem.Xy));

  const symbols = one.cellEntries().filter(([, value]) => value !== '.').map(([, value]) => value).toArray();

  const translated = symbols.map((symbol) => [
    // deno-lint-ignore no-non-null-assertion
    Utils.pick(one.find((value) => value === symbol)!, ['x', 'y']),
    // deno-lint-ignore no-non-null-assertion
    Utils.pick(two.find((value) => value === symbol)!, ['x', 'y']),
  ]);

  for (const [left, right] of translated.toSorted((a, b) => a[0].x - b[0].x || a[0].y - b[0].y)) {
    logger.info(
      left,
      right,
      // left.x - left.y + right.x + right.y === one.cols - 1,
      one.cols - 1 - left.x,
      3 - Math.floor(left.x / 2),
      left.y * 2,
      // 3 - left.x > (one.cols - 1) / 2 ? Math.floor(left.x / 2) : Math.ceil(left.x / 2),
      // 3 - left.y,
      // 3 - right.y,
      // left.x / 2,
      // right.x / 2,
      left.x % 2,
      left.y % 2,
      // right.x % 2,
      // right.y % 2,
    );
  }
}

function main() {
  const { data, logger, part } = new EcArgParser(import.meta.url);
  if (part === 1) part1(data, logger.makeChild('part1'));
  if (part === 2) part2(data, logger.makeChild('part2'));
  if (part === 3) part3(data, logger.makeChild('part3'));
  if (part === 4) part4(data, logger.makeChild('part4'));
}

main();
