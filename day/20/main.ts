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
  // first level index is jumps % 3
  const seen = new DefaultMap<number, PackedSet<Point2DLike, number>>(() => new PackedSet(Point2D.pack32, Point2D.unpack32));
  interface QueueItem extends Point2DLike {
    jumps: number;
  }
  seen.get(0).add(start);
  const queue = new Deque<QueueItem>([{ x: start.x, y: start.y, jumps: 0 }]);

  logger.info(grid);
  let best = Infinity;

  function rotate(point: Point2DLike, value: number): Point2DLike {
    let current = { ...point };
    let next = { ...point };
    for (let i = 0; i < value; ++i) {
      next = {
        x: grid.cols - 1 - current.y * 2 + current.x % 2,
        y: grid.rows - 1 - current.y + Math.ceil(current.x / 2),
      };
      current = next;
    }
    logger.debugHigh('rotate', point, value, current, grid.inBounds(current) ? grid.cellAt(current) : 'oob');
    return current;
  }

  while (queue.size && best === Infinity) {
    const item = queue.popFront();
    if (!item) throw new Error('oh no');
    logger.debugMed('pop', item, { xm2: item.x % 2, ym2: item.y % 2 });
    if (item.jumps === 0 && !Point2D.isEqual(item, { x: 0, y: 0 })) throw new Error('ugh');
    if (item.jumps === 1 && !Point2D.isEqual(item, { x: 1, y: 1 })) throw new Error('ugh');
    if (item.jumps === 2 && !Point2D.isEqual(item, { x: 2, y: 1 })) throw new Error('ugh');
    if (item.jumps === 3 && !Point2D.isEqual(item, { x: 3, y: 2 })) throw new Error('ugh');
    for (
      const offset of [
        { x: -1, y: 0 },
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        // FIXME: almost certainly got the y condition wrong
        item.y % 2 === item.x % 2 ? { x: 1, y: 1 } : { x: -1, y: -1 },
      ] satisfies Point2DLike[]
    ) {
      const nextItem = { ...Point2D.add(item, offset), jumps: item.jumps + 1 };
      if (!grid.inBounds(nextItem)) continue;
      const value = grid.cellAt(rotate(nextItem, nextItem.jumps % 3));
      if (value === 'E') {
        logger.debugLow('finished', nextItem);
        best = nextItem.jumps;
        break;
      }
      if (value !== 'T') continue;
      if (seen.get(nextItem.jumps % 3).has(nextItem)) continue;
      seen.get(nextItem.jumps % 3).add(nextItem);
      queue.pushBack(nextItem);
    }
  }

  logger.success(best);
}

/** no part4 - i'm figuring out coord rotation */
function part4(data: string, logger: Logger) {
  const [first, second, third] = data.split('\n\n').map((section) => new Grid(section.split('\n').map((line) => line.split('')), CoordSystem.Xy));

  const symbols = first.cellEntries().filter(([, value]) => value !== '.').map(([, value]) => value).toArray();

  const translated = symbols.map((symbol) => [
    // deno-lint-ignore no-non-null-assertion
    Utils.pick(first.find((value) => value === symbol)!, ['x', 'y']),
    // deno-lint-ignore no-non-null-assertion
    Utils.pick(second.find((value) => value === symbol)!, ['x', 'y']),
    // deno-lint-ignore no-non-null-assertion
    Utils.pick(third.find((value) => value === symbol)!, ['x', 'y']),
  ]);

  const centerX = Math.floor(first.cols / 2);

  for (const [one, two, three] of translated.toSorted((a, b) => a[0].x - b[0].x || a[0].y - b[0].y)) {
    logger.plain(
      one,
      two,
      three,
      // one.x - one.y + two.x + two.y === one.cols - 1,
      {
        a: first.cols - (Math.floor(one.x) + first.rows - one.y),
        dx: two.x - one.x,
        dy: two.y - one.y,
        dxy: Math.floor(two.x / 2) - one.y,
        dyx: two.y - Math.floor(one.x / 2),
        // a: one.cols - 1 - one.x,
        // b: 3 - Math.floor(one.x / 2),
        // c: one.y * 2,
        // d: Utils.modP(centerX - one.x, 2),
        // e: one.y % 2,
      },
      // 3 - one.x > (one.cols - 1) / 2 ? Math.floor(one.x / 2) : Math.ceil(one.x / 2),
      // 3 - one.y,
      // 3 - two.y,
      // one.x / 2,
      // two.x / 2,
      // one.x % 2,
      // two.x % 2,
      // two.y % 2,
    );
  }
}

function part5(data: string, logger: Logger) {
  const grids = data.split('\n\n').map((section) =>
    new Grid(
      section.split('\n').map((line) => {
        const width = line.length;
        const substring = line.replaceAll('.', '');
        return `${substring}${'.'.repeat(width - substring.length)}`.split('');
      }),
      CoordSystem.Xy,
    )
  );
  for (const grid of grids.filter((_, i) => i !== 1)) logger.plain(grid);
  const symbols = new Set(data.replaceAll(/[^a-z]/g, ''));
  // deno-lint-ignore no-non-null-assertion
  const translated = symbols.keys().map((symbol) => ({ symbol, points: grids.map((grid) => Utils.pick(grid.find((value) => value === symbol)!, ['x', 'y'])) }))
    .toArray();
  // translate from one to three i think?
  for (const { symbol, points: [one, two, three] } of translated) {
    const calc = {
      x: grids[0].cols - 1 - one.y * 2 + one.x % 2,
      y: grids[0].rows - 1 - one.y + Math.ceil(one.x / 2),
    };
    logger.plain(
      symbol,
      {
        one,
        // two,
        three,
        calc,
      },
      calc.x === three.x,
      calc.y === three.y,
    );
  }
}

function main() {
  const { data, logger, part } = new EcArgParser(import.meta.url);
  if (part === 1) part1(data, logger.makeChild('part1'));
  if (part === 2) part2(data, logger.makeChild('part2'));
  if (part === 3) part3(data, logger.makeChild('part3'));
  if (part === 4) part4(data, logger.makeChild('part4'));
  if (part === 5) part5(data, logger.makeChild('part5'));
}

main();
