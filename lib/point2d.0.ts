export type Point2DTuple = [x: number, y: number];
export interface Point2DLike {
  x: number;
  y: number;
}
export interface Bounds2D {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}
export enum Distance {
  Hypot,
  Hypot2,
  Max,
  Min,
  Sum,
}
export enum Offset2D {
  Cardinal,
  Diagonal,
  Square,
  Circle,
  CirclePlus,
  Diamond,
}

// these all refer to the same area in memory
// f64[2] is a scratch area for intermediate values
const float64Array = new Float64Array(3);
// used in `pack` and `unpack`
const bigUint64Array = new BigUint64Array(float64Array.buffer);
// used in `pack32` and `unpack32`
const float32Array = new Float32Array(float64Array.buffer);
// used in `hash`
const uint16Array = new Uint16Array(float64Array.buffer);

/** Classes have a performance penalty so all class methods are also available statically for `Point2DLike` objects */
export class Point2D implements Point2DLike {
  x: number;
  y: number;
  constructor(x: number, y: number);
  constructor(value: Point2DLike);
  constructor(value: Point2DTuple);
  constructor(a: number | Point2DLike | Point2DTuple, b?: number) {
    if (typeof a === 'number' && typeof b === 'number') [this.x, this.y] = [a, b];
    else if (Array.isArray(a)) [this.x, this.y] = a;
    else if (typeof a === 'object') [this.x, this.y] = [a.x, a.y];
    else throw new Error('invalid constructor params');
  }

  // convenience wrappers of static methods
  add(other: Point2DLike): Point2D {
    return new Point2D(Point2D.add(this, other));
  }
  subtract(other: Point2DLike): Point2D {
    return new Point2D(Point2D.subtract(this, other));
  }
  multiply(other: Point2DLike): Point2D;
  multiply(value: number): Point2D;
  multiply(param: Point2DLike | number): Point2D {
    return new Point2D(Point2D.multiply(this, param as Point2DLike));
  }
  isEqual(other: Point2DLike): boolean {
    return Point2D.isEqual(this, other);
  }
  distance(other: Point2DLike, type: Distance): number {
    return Point2D.distance(this, other, type);
  }
  neighbours(...params: Parameters<typeof Point2D.offsets>): Point2D[] {
    return Point2D.offsets(...params).map((offset) => this.add(offset));
  }
  angle(other: Point2DLike): number {
    return Point2D.angle(this, other);
  }

  // static versions of class methods
  static add(value: Point2DLike, other: Point2DLike): Point2DLike {
    return { x: other.x + value.x, y: other.y + value.y };
  }
  static subtract(value: Point2DLike, other: Point2DLike): Point2DLike {
    return { x: other.x - value.x, y: other.y - value.y };
  }
  static multiply(value: Point2DLike, other: Point2DLike): Point2DLike;
  static multiply(value: Point2DLike, multiplier: number): Point2DLike;
  static multiply(value: Point2DLike, param: Point2DLike | number): Point2DLike {
    return typeof param === 'number' ? { x: param * value.x, y: param * value.y } : { x: param.x * value.x, y: param.y * value.y };
  }
  static isEqual(value: Point2DLike, other: Point2DLike): boolean {
    return other.x === value.x && other.y === value.y;
  }
  static distance(value: Point2DLike, other: Point2DLike, type: Distance): number {
    const [x, y] = [other.x - value.x, other.y - value.y];
    switch (type) {
      case Distance.Hypot:
        return Math.sqrt(x ** 2 + y ** 2);
      case Distance.Hypot2:
        return x ** 2 + y ** 2;
      case Distance.Max:
        return Math.max(Math.abs(x), Math.abs(y));
      case Distance.Min:
        return Math.min(Math.abs(x), Math.abs(y));
      case Distance.Sum:
        return Math.abs(x) + Math.abs(y);
    }
  }
  static neighbours(value: Point2DLike, ...params: Parameters<typeof Point2D.offsets>): Point2DLike[] {
    return Point2D.offsets(...params).map((offset) => Point2D.add(value, offset));
  }
  static angle(value: Point2DLike, other: Point2DLike) {
    return Math.atan2(other.y - value.y, other.x - value.x);
  }

  // static utilities
  static offsets(radius: number, constrainer: Offset2D | ((offset: Point2DLike) => boolean)): Point2DLike[] {
    // this was far too slow as a generator
    if (constrainer === Offset2D.Cardinal || constrainer === Offset2D.Diagonal) {
      const result = new Array<Point2DLike>(radius * 4);
      let index = 0;
      for (let i = 1; i <= radius; ++i) {
        if (constrainer === Offset2D.Cardinal) {
          result[index++] = { x: 0, y: -i };
          result[index++] = { x: i, y: 0 };
          result[index++] = { x: 0, y: i };
          result[index++] = { x: -i, y: 0 };
        } else {
          result[index++] = { x: i, y: -i };
          result[index++] = { x: i, y: i };
          result[index++] = { x: -i, y: i };
          result[index++] = { x: -i, y: -i };
        }
      }
      return result;
    }
    const result: Point2DLike[] = [];
    if (typeof constrainer === 'function') {
      for (let x = -radius; x <= radius; ++x) {
        for (let y = -radius; y <= radius; ++y)
          if (constrainer({ x, y })) result.push({ x, y });
      }
      return result;
    } else {
      const radius2 = constrainer === Offset2D.Circle ? radius ** 2 : constrainer === Offset2D.CirclePlus ? (radius + 0.5) ** 2 : 0;
      for (let x = 0; x <= radius; ++x) {
        for (let y = 0; y <= radius; ++y) {
          if (
            (x !== 0 || y !== 0) &&
            (constrainer === Offset2D.Square ||
              (constrainer === Offset2D.Circle && x ** 2 + y ** 2 <= radius2) ||
              (constrainer === Offset2D.CirclePlus && x ** 2 + y ** 2 < radius2) ||
              (constrainer === Offset2D.Diamond && x + y <= radius))
          ) {
            result.push({ x, y }, { x, y: -y }, { x: -x, y }, { x: -x, y: -y });
          } else { continue; }
        }
      }
    }
    return result;
  }
  static getBounds(iterable: Iterable<Point2DLike>): Bounds2D {
    const items = [...iterable];
    return items.length
      ? items.reduce(
        (acc, item) => ({
          minX: Math.min(acc.minX, item.x),
          maxX: Math.max(acc.maxX, item.x),
          minY: Math.min(acc.minY, item.y),
          maxY: Math.max(acc.maxY, item.y),
        }),
        { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity },
      )
      : { minX: 0, maxX: 0, minY: 0, maxY: 0 };
  }
  static makeInBounds({ minX, maxX, minY, maxY }: Bounds2D) {
    return function (value: Point2DLike) {
      return value.x >= minX && value.x <= maxX && value.y >= minY && value.y <= maxY;
    };
  }
  /** Lossless but slower than other `pack` and `hash` functions
   *
   * Use
   * - `pack32` for small numbers which can fit into f32
   * - `hash` if you just need to make a `Point2DLike` hashable
   *
   * **`Set` hates the output of this for small int inputs and will take 100x as long as you expect to process it** (22.9s vs 170ms). Maybe an alignment bug/misbehaviour in v8? Converting to a string first is faster
   * @returns 128-bit wide bigint */
  static pack(value: Point2DLike): bigint {
    float64Array[0] = value.x;
    float64Array[1] = value.y;
    const [x, y] = bigUint64Array;
    return (x << 64n) | y;
  }
  static unpack(value: bigint): Point2DLike {
    bigUint64Array[0] = value >> 64n;
    bigUint64Array[1] = value;
    const [x, y] = float64Array;
    return { x, y };
  }
  /** Much faster than `pack` and slightly faster than `hash`
   *
   * Only useful for small integers and small low-precision floats which can fit into f32 */
  static pack32(value: Point2DLike): number {
    // reading the array buffer as a bigUint64 also works but it's not as fast, and takes longer to add to a set
    float32Array[0] = value.x;
    float32Array[1] = value.y;
    return float64Array[0];
  }
  static unpack32(value: number): Point2DLike {
    float64Array[0] = value;
    const [x, y] = float32Array;
    return { x, y };
  }
  /** Much faster than `pack`, slightly slower than `pack32`
   *
   * 0% collisions on 10m unique clustered inputs each of small int, small float, large int, large float */
  static hash(value: Point2DLike): number {
    // fill out the significand. there's probably a better way to do this
    float64Array[0] = value.x * Math.LOG2E;
    float64Array[1] = value.y * Math.PI;

    // mix f64[0] (uint16[0-3]) and f64[1] (uint16[4-7]) into f64[2] (uint16[8-11])
    uint16Array[8] = uint16Array[0] ^ uint16Array[5] ^ (uint16Array[1] * 3) ^ (uint16Array[6] * 5);
    uint16Array[9] = uint16Array[1] ^ uint16Array[6] ^ (uint16Array[2] * 7) ^ (uint16Array[7] * 9);
    uint16Array[10] = uint16Array[2] ^ uint16Array[7] ^ (uint16Array[3] * 11) ^ (uint16Array[4] * 13);
    uint16Array[11] = uint16Array[3] ^ uint16Array[4] ^ (uint16Array[0] * 15) ^ (uint16Array[5] * 17);

    // if all the exponent bits are on, the entire f64 is invalid and NaN is returned.
    // https://en.wikipedia.org/wiki/Double-precision_floating-point_format
    // xor the top exponent bit somewhere else
    uint16Array[10] ^= uint16Array[11] & 0x4000;
    // then turn it off
    uint16Array[11] &= 0xbfff;
    return float64Array[2];
  }
}
