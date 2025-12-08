import { Point2D, Point2DLike } from '@/point2d.0.ts';

const set = new Set();
while (true) {
  const point: Point2DLike = { x: (Math.random() - 0.5) * 2 * Number.MAX_SAFE_INTEGER, y: (Math.random() - 0.5) * 2 * Number.MAX_SAFE_INTEGER };
  const hash = Point2D.hash(point);
  if (set.has(hash)) {
    // deno-lint-ignore no-console
    console.log('hash', hash, point, set.size);
  } else { set.add(hash); }
}
