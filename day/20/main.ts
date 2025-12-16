import { EcArgParser } from '@/lib/args.1.ts';
import { DefaultMap } from '@/lib/default-map.0.ts';
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
  // pushing everything over to the left makes point translation easier
  const grid = new Grid(
    data.split('\n').map((line) => {
      const width = line.length;
      const substring = line.replaceAll('.', '');
      return `${substring}${'.'.repeat(width - substring.length)}`.split('');
    }),
    CoordSystem.Xy,
  );
  const start = grid.find((value) => value === 'S');
  const end = grid.find((value) => value === 'E');
  logger.debugLow({ start, end });
  if (!start || !end) throw new Error('oh no');

  function rotate(point: Point2DLike, value: number): Point2DLike {
    let current = { ...point };
    let next: Point2DLike;
    for (let i = 0; i < value; ++i) {
      // i just played with the numbers until the translated values matched my test file
      next = {
        x: grid.cols - 1 - current.y * 2 + current.x % 2,
        y: grid.rows - 1 - current.y + Math.ceil(current.x / 2),
      };
      current = { ...next };
    }
    return current;
  }

  // first level index is jumps % 3
  const seen = new DefaultMap<number, PackedSet<Point2DLike, number>>(() => new PackedSet(Point2D.pack32, Point2D.unpack32));
  seen.get(0).add(start);

  interface QueueItem extends Point2DLike {
    jumps: number;
  }
  const queue = new Deque<QueueItem>([{ x: start.x, y: start.y, jumps: 0 }]);

  let best = Infinity;

  while (queue.size && best === Infinity) {
    const item = queue.popFront();
    if (!item) throw new Error('oh no');
    logger.debugMed('pop', item);
    for (
      const offset of [
        { x: -1, y: 0 },
        // can jump in place
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        // even x can jump up, odd down
        item.x % 2 === 0 ? { x: 1, y: 1 } : { x: -1, y: -1 },
      ] satisfies Point2DLike[]
    ) {
      const nextItem = { ...Point2D.add(item, offset), jumps: item.jumps + 1 };
      if (!grid.inBounds(nextItem)) continue;
      // only need to translate to get the cell value
      const value = grid.cellAt(rotate(nextItem, nextItem.jumps % 3));
      if (value === '#' || value === '.') continue;
      if (value === 'E') {
        logger.debugLow('finished', nextItem);
        best = nextItem.jumps;
        break;
      }
      if (seen.get(nextItem.jumps % 3).has(nextItem)) continue;
      seen.get(nextItem.jumps % 3).add(nextItem);
      queue.pushBack(nextItem);
    }
  }

  // 488
  logger.success(best);
}

function main() {
  const { data, logger, part } = new EcArgParser(import.meta.url);
  if (part === 1) part1(data, logger.makeChild('part1'));
  if (part === 2) part2(data, logger.makeChild('part2'));
  if (part === 3) part3(data, logger.makeChild('part3'));
}

main();
