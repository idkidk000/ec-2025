import { Point2DLike } from '@/lib/point2d.0.ts';

export interface Line {
  a: Point2DLike;
  b: Point2DLike;
}

function factorial(value: number): number | undefined {
  if (value < 0) return undefined;
  if (value === 0) return 1;
  const next = factorial(value - 1);
  if (typeof next === 'undefined') return next;
  return value * next;
}

/** greatest common denominator */
function gcd(left: number, right: number): number {
  while (right !== 0) [left, right] = [right, left % right];
  return left;
}

export const Utils = {
  clamp(value: number, min: number, max: number): number {
    return Math.max(Math.min(value, max), min);
  },
  factorial,
  gcd,
  /** lowest common multiple */
  lcm(...values: number[]): number {
    return values.reduce((acc, item) => (acc * item) / gcd(acc, item));
  },
  /** linear interpolate */
  lerp(left: number, right: number, steps: number, step: number) {
    return left + ((right - left) / steps) * step;
  },
  lineIntersect(
    { a: { x: x0, y: y0 }, b: { x: x1, y: y1 } }: Line,
    { a: { x: x2, y: y2 }, b: { x: x3, y: y3 } }: Line,
    infinite: boolean = false,
  ): Point2DLike | undefined {
    const denominator = (x0 - x1) * (y2 - y3) - (y0 - y1) * (x2 - x3);
    if (denominator === 0) return;
    const lengthA = ((x0 - x2) * (y2 - y3) - (y0 - y2) * (x2 - x3)) / denominator;
    const lengthB = ((x0 - x2) * (y0 - y1) - (y0 - y2) * (x0 - x1)) / denominator;
    if (infinite || (lengthA >= 0 && lengthA <= 1 && lengthB >= 0 && lengthB <= 1))
      return { x: x0 + lengthA * (x1 - x0), y: y0 + lengthA * (y1 - y0) };
  },
  minMax(...values: number[]): [number, number] {
    return values.reduce((acc, item) => [Math.min(acc[0], item), Math.max(acc[1], item)], [Infinity, -Infinity]);
  },
  sum(...values: number[]): number {
    return values.reduce((acc, item) => acc + item, 0);
  },
  mean(...values: number[]): number {
    if (values.length === 0) return NaN;
    const total = values.reduce((acc, item) => acc + item, 0);
    return total / values.length;
  },
  median(...values: number[]): number {
    if (values.length === 0) return NaN;
    if (values.length % 2 === 1) return values[Math.floor(values.length / 2)];
    const [a, b] = [values[Math.floor(values.length / 2)], values[Math.ceil(values.length / 2)]];
    return (a + b) / 2;
  },
  mode(...values: number[]): number {
    if (values.length === 0) return NaN;
    const counts = new Map<number, number>();
    for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
    const [maxCount] = counts.values().toArray().toSorted((a, b) => b - a);
    const topValues = counts.entries().filter(([, count]) => count === maxCount).map(([value]) => value).toArray();
    return Utils.mean(...topValues);
  },
  /** positive modulo */
  modP(value: number, mod: number) {
    const result = value % mod;
    return result >= 0 ? result : result + mod;
  },
  roundTo: (value: number, digits = 3) => {
    const multiplier = 10 ** digits;
    return Math.round(value * multiplier) / multiplier;
  },
  groupBy: <Item, Key>(items: Iterable<Item>, selector: (value: Item) => Key): Map<Key, Item[]> => {
    const grouped = new Map<Key, Item[]>();
    for (const item of items) {
      const key = selector(item);
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)?.push(item);
    }
    return grouped;
  },
};
