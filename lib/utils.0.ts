import { Point2DLike } from '@/lib/point2d.0.ts';

export interface Line {
  a: Point2DLike;
  b: Point2DLike;
}

export abstract class Utils {
  static clamp(value: number, min: number, max: number): number {
    return Math.max(Math.min(value, max), min);
  }
  static factorial(value: number): number | undefined {
    if (value < 0) return undefined;
    if (value === 0) return 1;
    const next = Utils.factorial(value - 1);
    if (typeof next === 'undefined') return next;
    return value * next;
  }
  /** greatest common denominator */
  static gcd(left: number, right: number): number {
    while (right !== 0) [left, right] = [right, left % right];
    return left;
  }
  /** lowest common multiple */
  static lcm(...values: number[]): number {
    return values.reduce((acc, item) => (acc * item) / Utils.gcd(acc, item));
  }
  /** linear interpolate */
  static lerp(left: number, right: number, steps: number, step: number): number {
    return left + ((right - left) / steps) * step;
  }
  static lineIntersect(
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
  }
  static minMax(...values: number[]): [min: number, max: number] {
    return values.reduce((acc, item) => [Math.min(acc[0], item), Math.max(acc[1], item)], [Infinity, -Infinity]);
  }
  static sum(...values: number[]): number {
    return values.reduce((acc, item) => acc + item, 0);
  }
  static mean(...values: number[]): number {
    if (values.length === 0) return NaN;
    const total = values.reduce((acc, item) => acc + item, 0);
    return total / values.length;
  }
  static median(...values: number[]): number {
    if (values.length === 0) return NaN;
    if (values.length % 2 === 1) return values[Math.floor(values.length / 2)];
    const [a, b] = [values[Math.floor(values.length / 2)], values[Math.ceil(values.length / 2)]];
    return (a + b) / 2;
  }
  static mode(...values: number[]): number {
    if (values.length === 0) return NaN;
    const counts = new Map<number, number>();
    for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
    const [maxCount] = counts.values().toArray().toSorted((a, b) => b - a);
    const topValues = counts.entries().filter(([, count]) => count === maxCount).map(([value]) => value).toArray();
    return Utils.mean(...topValues);
  }
  /** mod but it works like python - sign of result matches sign of `mod` */
  static modP(value: number, mod: number): number {
    const intermediate = value % mod;
    return intermediate + ((mod > 0 && intermediate < 0) || (mod < 0 && intermediate > 0) ? mod : 0);
  }
  static divMod(value: number, mod: number): [div: number, mod: number] {
    return [Math.floor(value / mod), Utils.modP(value, mod)];
  }
  static roundTo(value: number, digits = 3): number {
    const multiplier = 10 ** digits;
    return Math.round(value * multiplier) / multiplier;
  }
  static groupBy<Item, Key>(items: Iterable<Item>, selector: (value: Item) => Key): Map<Key, Item[]> {
    const grouped = new Map<Key, Item[]>();
    for (const item of items) {
      const key = selector(item);
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)?.push(item);
    }
    return grouped;
  }
}
