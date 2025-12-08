import { CoordSystem, Grid } from '@/grid.0.ts';
import { Logger } from '@/logger.0.ts';
import { Offset2D, Point2D } from '@/point2d.0.ts';
import { HashedSet } from '@/hashed-set.0.ts';

const logger = new Logger(import.meta.url);
const size = 15;
const point = new Point2D({ x: size + 1, y: size + 1 });
const grid = new Grid({ rows: size * 2 + 3, cols: size * 2 + 3, fill: () => '.' }, CoordSystem.Xy, (c) => ` ${c}`);
const set = new HashedSet(Point2D.hash);

for (const key of Object.keys(Offset2D).filter((key) => isNaN(parseInt(key)))) {
  grid.fill('.');
  set.clear();
  for (const n of point.neighbours(size, Offset2D[key as keyof typeof Offset2D])) {
    if (set.has(n)) throw new Error(`duplicate neighbour ${n}`);
    set.add(n);
    grid.cellSet(n, '#');
  }
  logger.info(key, grid);
}
