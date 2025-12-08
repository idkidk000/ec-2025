import { CoordSystem, Grid } from '@/grid.0.ts';
import { Logger } from '@/logger.0.ts';
import { Offset3D, Point3D } from '@/point3d.0.ts';
import { Utils } from '@/utils.0.ts';
import { HashedSet } from '@/hashed-set.0.ts';

const logger = new Logger(import.meta.url);
const size = 3;
const point = new Point3D({ x: size + 1, y: size + 1, z: size + 1 });
const grid = new Grid({ rows: size * 2 + 3, cols: size * 2 + 3, fill: () => '.' }, CoordSystem.Xy, (c) => ` ${c}`);
const set = new HashedSet(Point3D.hash);

for (const key of Object.keys(Offset3D).filter((key) => isNaN(parseInt(key)))) {
  const neighbours = point.neighbours(size, Offset3D[key as keyof typeof Offset3D]);
  const slices = Utils.groupBy(neighbours, ({ z }) => z);
  for (const [z, slice] of slices.entries().toArray().toSorted(([a], [b]) => a - b)) {
    grid.fill('.');
    set.clear();
    for (const item of slice) {
      if (set.has(item)) throw new Error(`duplicate neighbour ${item}`);
      set.add(item);
      grid.cellSet(item, '#');
    }
    logger.info(key, { z }, grid);
  }
}
