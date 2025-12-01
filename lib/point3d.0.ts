export type Point3DTuple = [x: number, y: number, z: number];
export interface Point3DLike {
  x: number;
  y: number;
  z: number;
}
export interface Bounds3D {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
}
export enum Distance {
  Hypot,
  Hypot2,
  Max,
  Min,
  Sum,
}
export enum Offset3D {
  Cardinal,
  Diagonal,
  Cube,
  Sphere,
  SpherePlus,
  Diamond,
}

// these all refer to the same area in memory
// f64[3] is used for building the return value of `hash`
const float64Array = new Float64Array(4);
// used in `pack` and `unpack`
const bigUint64Array = new BigUint64Array(float64Array.buffer);
// used in `hash`
const uint16Array = new Uint16Array(float64Array.buffer);
// used in `packInt21`, `unpackInt21
const uint32Array = new Uint32Array(float64Array.buffer);
// used in `packFloat21`, `unpackFloat21`
const float32Array = new Float32Array(float64Array.buffer);
const PACK_INT_21_BIAS = (1 << 20) - 1;

/** Classes have a performance penalty so all class methods are also available statically for `Point3DLike` objects */
export class Point3D implements Point3DLike {
  x: number;
  y: number;
  z: number;
  constructor(x: number, y: number, z: number);
  constructor(value: Point3DLike);
  constructor(value: Point3DTuple);
  constructor(a: number | Point3DLike | Point3DTuple, b?: number, c?: number) {
    if (typeof a === 'number' && typeof b === 'number' && typeof c === 'number') [this.x, this.y, this.z] = [a, b, c];
    else if (Array.isArray(a)) [this.x, this.y, this.z] = a;
    else if (typeof a === 'object') [this.x, this.y, this.z] = [a.x, a.y, a.z];
    else throw new Error('invalid constructor params');
  }

  // convenience wrappers of static methods
  add(other: Point3DLike): Point3D {
    return new Point3D(Point3D.add(this, other));
  }
  subtract(other: Point3DLike): Point3D {
    return new Point3D(Point3D.subtract(this, other));
  }
  multiply(other: Point3DLike): Point3D;
  multiply(value: number): Point3D;
  multiply(param: Point3DLike | number): Point3D {
    return new Point3D(Point3D.multiply(this, param as Point3DLike));
  }
  isEqual(other: Point3DLike): boolean {
    return Point3D.isEqual(this, other);
  }
  distance(other: Point3DLike, type: Distance): number {
    return Point3D.distance(this, other, type);
  }
  neighbours(...params: Parameters<typeof Point3D.offsets>): Point3D[] {
    return Point3D.offsets(...params).map((offset) => this.add(offset));
  }

  // static versions of class methods
  static add(value: Point3DLike, other: Point3DLike): Point3DLike {
    return { x: other.x + value.x, y: other.y + value.y, z: other.z + value.z };
  }
  static subtract(value: Point3DLike, other: Point3DLike): Point3DLike {
    return { x: other.x - value.x, y: other.y - value.y, z: other.z - value.z };
  }
  static multiply(value: Point3DLike, other: Point3DLike): Point3DLike;
  static multiply(value: Point3DLike, multiplier: number): Point3DLike;
  static multiply(value: Point3DLike, param: Point3DLike | number): Point3DLike {
    return typeof param === 'number'
      ? { x: param * value.x, y: param * value.y, z: param * value.z }
      : { x: param.x * value.x, y: param.y * value.y, z: param.z * value.z };
  }
  static isEqual(value: Point3DLike, other: Point3DLike): boolean {
    return other.x === value.x && other.y === value.y && other.z === value.z;
  }
  static distance(value: Point3DLike, other: Point3DLike, type: Distance): number {
    const [x, y, z] = [other.x - value.x, other.y - value.y, other.z - value.z];
    switch (type) {
      case Distance.Hypot:
        return Math.sqrt(x ** 2 + y ** 2 + z ** 2);
      case Distance.Hypot2:
        return x ** 2 + y ** 2 + z ** 2;
      case Distance.Max:
        return Math.max(Math.abs(x), Math.abs(y), Math.abs(z));
      case Distance.Min:
        return Math.min(Math.abs(x), Math.abs(y), Math.abs(z));
      case Distance.Sum:
        return Math.abs(x) + Math.abs(y), Math.abs(z);
    }
  }
  static neighbours(value: Point3DLike, ...params: Parameters<typeof Point3D.offsets>): Point3DLike[] {
    return Point3D.offsets(...params).map((offset) => Point3D.add(value, offset));
  }

  // static utilities
  static offsets(radius: number, constrainer: Offset3D | ((offset: Point3DLike) => boolean)): Point3DLike[] {
    // this was far too slow as a generator
    if (constrainer === Offset3D.Cardinal || constrainer === Offset3D.Diagonal) {
      const result = new Array<Point3DLike>(radius * (constrainer === Offset3D.Cardinal ? 6 : 8));
      let index = 0;
      for (let i = 1; i <= radius; ++i) {
        if (constrainer === Offset3D.Cardinal) {
          result[index++] = { x: 0, y: 0, z: -i };
          result[index++] = { x: 0, y: -i, z: 0 };
          result[index++] = { x: i, y: 0, z: 0 };
          result[index++] = { x: 0, y: i, z: 0 };
          result[index++] = { x: -i, y: 0, z: 0 };
          result[index++] = { x: 0, y: 0, z: i };
        } else {
          result[index++] = { x: i, y: -i, z: -i };
          result[index++] = { x: i, y: i, z: -i };
          result[index++] = { x: -i, y: i, z: -i };
          result[index++] = { x: -i, y: -i, z: -i };
          result[index++] = { x: i, y: -i, z: i };
          result[index++] = { x: i, y: i, z: i };
          result[index++] = { x: -i, y: i, z: i };
          result[index++] = { x: -i, y: -i, z: i };
        }
      }
      return result;
    }
    const result: Point3DLike[] = [];
    if (typeof constrainer === 'function') {
      for (let x = -radius; x <= radius; ++x) {
        for (let y = -radius; y <= radius; ++y) {
          for (let z = -radius; z <= radius; ++z)
            if (constrainer({ x, y, z })) result.push({ x, y, z });
        }
      }
    } else {
      const radius2 = constrainer === Offset3D.Sphere ? radius ** 2 : constrainer === Offset3D.SpherePlus ? (radius + 0.5) ** 2 : 0;
      for (let x = 0; x <= radius; ++x) {
        for (let y = 0; y <= radius; ++y) {
          for (let z = 0; z <= radius; ++z) {
            if (
              (x !== 0 || y !== 0 || z !== 0) &&
              (constrainer === Offset3D.Cube ||
                (constrainer === Offset3D.Sphere && x ** 2 + y ** 2 + z ** 2 <= radius2) ||
                (constrainer === Offset3D.SpherePlus && x ** 2 + y ** 2 + z ** 2 < radius2) ||
                (constrainer === Offset3D.Diamond && Math.abs(x) + Math.abs(y) + Math.abs(z) <= radius))
            ) {
              result.push(
                { x, y, z },
                { x, y, z: -z },
                { x, y: -y, z },
                { x, y: -y, z: -z },
                { x: -x, y, z },
                { x: -x, y, z: -z },
                { x: -x, y: -y, z },
                { x: -x, y: -y, z: -z },
              );
            } else { continue; }
          }
        }
      }
    }
    return result;
  }
  static getBounds(iterable: Iterable<Point3DLike>): Bounds3D {
    const items = [...iterable];
    return items.length
      ? items.reduce(
        (acc, item) => ({
          minX: Math.min(acc.minX, item.x),
          maxX: Math.max(acc.maxX, item.x),
          minY: Math.min(acc.minY, item.y),
          maxY: Math.max(acc.maxY, item.y),
          minZ: Math.min(acc.minZ, item.z),
          maxZ: Math.max(acc.maxZ, item.z),
        }),
        { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity, minZ: Infinity, maxZ: -Infinity },
      )
      : { minX: 0, maxX: 0, minY: 0, maxY: 0, minZ: 0, maxZ: 0 };
  }
  static makeInBounds({ minX, maxX, minY, maxY, minZ, maxZ }: Bounds3D) {
    return function (value: Point3DLike) {
      return value.x >= minX && value.x <= maxX && value.y >= minY && value.y <= maxY && value.z >= minZ && value.z <= maxZ;
    };
  }
  /** Lossless but slower than other `pack` and `hash` functions
   *
   * Use
   * - `packInt21` for integers which can fit into i21
   * - `packFloat21` for numbers which can fit into f21 (6 exponent and 14 significand bits)
   * - `pack32` for numbers which can fit into f32
   * - `hash` if you just need to make a `Point3DLike` hashable
   *
   * **Adding a large number of these to a `Set` will hang indefinitely if your inputs were small ints.** Maybe an alignment bug/misbehaviour in v8? Converting to a string first is a workaround
   * @returns 192-bit wide bigint */
  static pack(value: Point3DLike): bigint {
    float64Array[0] = value.x;
    float64Array[1] = value.y;
    float64Array[2] = value.z;
    const [x, y, z] = bigUint64Array;
    return (x << 128n) | (y << 64n) | z;
  }
  static unpack(value: bigint): Point3DLike {
    bigUint64Array[0] = value >> 128n;
    bigUint64Array[1] = value >> 64n;
    bigUint64Array[2] = value;
    const [x, y, z] = float64Array;
    return { x, y, z };
  }
  /** Much faster than `pack` but slower than `pack(Int|Float)21`
   *
   * Only useful for small integers and small low-precision floats which can fit into f32
   * @returns 96-bit wide bigint */
  static pack32(value: Point3DLike): bigint {
    float32Array[0] = value.x;
    float32Array[1] = value.y;
    float32Array[2] = value.z;
    return (bigUint64Array[0] << 32n) | (bigUint64Array[1] & 0xffffffffn);
  }
  static unpack32(value: bigint): Point3DLike {
    bigUint64Array[0] = value >> 32n;
    bigUint64Array[1] = value & 0xffffffffn;
    const [x, y, z] = float32Array;
    return { x, y, z };
  }
  /** Much faster than `pack`, `pack32`, and `packFloat21`
   *
   * Truncates x, y, and z to 21-bit biased ints
   *
   * Only useful for small integers which can fit into i21 */
  static packInt21(value: Point3DLike): number {
    uint32Array[0] = value.x + PACK_INT_21_BIAS;
    uint32Array[1] = value.y + PACK_INT_21_BIAS;
    uint32Array[2] = value.z + PACK_INT_21_BIAS;

    // pack from u16[0-1,2-3,4-5] to u16[8-11]
    // u32[0](x) 0-15
    uint16Array[8] = uint16Array[0];
    // u32[0](x) 16-20 | u32[1](y) 0-10
    uint16Array[9] = (uint16Array[1] & 0x1f) | (uint16Array[2] << 5);
    // u32[1](y) 11-15 | u32[1](y) 16-20 | u32[2](z) 0-5
    uint16Array[10] = (uint16Array[2] >> 11) | ((uint16Array[3] & 0x1f) << 5) | (uint16Array[4] << 10);
    // u32[2](z) 6-15 | u32[2](z) 16-19 | gap (NaN) | u32[2](z) 20
    uint16Array[11] = (uint16Array[4] >> 6) | ((uint16Array[5] & 0xf) << 10) | ((uint16Array[5] & 0x10) << 11);

    return float64Array[2];
  }
  static unpackInt21(value: number): Point3DLike {
    float64Array[2] = value;

    // unpack from u16[8-11] to u16[0-1,2-3,4-5]
    // x
    uint16Array[0] = uint16Array[8];
    uint16Array[1] = uint16Array[9] & 0x1f;

    // y
    uint16Array[2] = (uint16Array[9] >> 5) | (uint16Array[10] << 11);
    uint16Array[3] = (uint16Array[10] >> 5) & 0x1f;

    // z
    uint16Array[4] = (uint16Array[10] >> 10) | (uint16Array[11] << 6);
    uint16Array[5] = ((uint16Array[11] >> 10) & 0xf) | ((uint16Array[11] >> 11) & 0x10);

    const x = uint32Array[0] - PACK_INT_21_BIAS;
    const y = uint32Array[1] - PACK_INT_21_BIAS;
    const z = uint32Array[2] - PACK_INT_21_BIAS;
    return { x, y, z };
  }
  /** Much faster than `pack` and `pack32`. Slower than `packInt21`
   *
   * Truncates x, y, and z to 21-bit floats with 6 exponent and 14 significand bits
   *
   * Only useful for small integers and small low-precision floats which can fit into f21 */
  static packFloat21(value: Point3DLike): number {
    float32Array[0] = value.x;
    float32Array[1] = value.y;
    float32Array[2] = value.z;

    // f32 has 8 exponent and 23 significand bits
    // f16 has 5 exponent and 10 significand bits
    // f21 can have 6 exponent and 14 significand bits i suppose. probably ought to test a bit
    // exponent is biased to (1<<(num bits-1))-1 so that it can represent negatives

    // f32 structure:
    //   0-22 : l0-15, h0-7: significand (we want 9-22)
    //   23-30: h7-14      : exponent (we want 23-28 but it has to be rebiased first)
    //   31   : h15        : sign

    // f21 structure
    //   0-13 significand
    //   14-19 exponent
    //   20: sign

    // read the whole exponent, remove 8-bit bias, add 6-bit bias, mask to 6 bits
    // exponent === 0 is a special case and must remain as 0
    // these are exponent 23-28 equivalent
    const origXExponent = (uint16Array[1] & 0x7f80) >> 7;
    const origYExponent = (uint16Array[3] & 0x7f80) >> 7;
    const origZExponent = (uint16Array[5] & 0x7f80) >> 7;
    const xExponent = origXExponent ? ((origXExponent - 96) & 0x3f) : origXExponent;
    const yExponent = origYExponent ? ((origYExponent - 96) & 0x3f) : origYExponent;
    const zExponent = origZExponent ? ((origZExponent - 96) & 0x3f) : origZExponent;

    // pack from u16[0-1,2-3,4-5] to u16[8-11]
    // f32[0](x) significand 9-15 | f32[0](x) significand 16-22 | f32[0](x) exponent 23-24
    uint16Array[8] = (uint16Array[0] >> 9) | ((uint16Array[1] & 0x7f) << 7) | (xExponent << 14);

    // f32[0](x) exponent 25-28 | f32[0](x) sign | f32[1](y) significand 9-15 | f32[1](y) significand 16-19
    uint16Array[9] = (xExponent >> 2) | ((uint16Array[1] & 0x8000) >> 11) | ((uint16Array[2] & 0xfe00) >> 4) | (uint16Array[3] << 12);

    // f32[1](y) significand 20-22 | f32[1](y) exponent 23-28 | f32[1](y) sign | f32[2](z) significand 9-14
    uint16Array[10] = ((uint16Array[3] & 0x70) >> 4) | (yExponent << 3) | ((uint16Array[3] & 0x8000) >> 6) | ((uint16Array[4] & 0x7e00) << 1);

    // f32[2](z) significand 15 | f32[2](z) significand 16-22 | f32[2](z) exponent 23-28 | off (NaN) | f32[2](z) sign
    uint16Array[11] = (uint16Array[4] >> 15) | ((uint16Array[5] & 0x7f) << 1) | (zExponent << 8) | (uint16Array[5] & 0x8000);

    return float64Array[2];
  }
  static unpackFloat21(value: number): Point3DLike {
    float64Array[2] = value;

    // remove 6 bit bias, add 8 bit bias
    // exponent === 0 is a special case and must remain as 0
    // these are exponent 23-28 equivalent
    const origXExponent = (uint16Array[8] >> 14) | ((uint16Array[9] & 0xf) << 2);
    const origYExponent = (uint16Array[10] & 0x1f8) >> 3;
    const origZExponent = (uint16Array[11] & 0x3f00) >> 8;
    const xExponent = origXExponent ? origXExponent + 96 : origXExponent;
    const yExponent = origYExponent ? origYExponent + 96 : origYExponent;
    const zExponent = origZExponent ? origZExponent + 96 : origZExponent;

    // unpack from u16[8-11] to u16[0-1,2-3,4-5]
    // f32[0](x) significand 9-15
    uint16Array[0] = uint16Array[8] << 9;
    // f32[0](x) significand 16-22 | exponent 23-28 | sign
    uint16Array[1] = ((uint16Array[8] & 0x3f80) >> 7) | (xExponent << 7) | ((uint16Array[9] & 0x10) << 11);

    // f32[1](y) significand 9-15
    uint16Array[2] = (uint16Array[9] & 0xfe0) << 4;
    // f32[1](y) significand 16-22 | exponent 23-28 | sign
    uint16Array[3] = (uint16Array[9] >> 12) | ((uint16Array[10] & 0x7) << 4) | (yExponent << 7) | ((uint16Array[10] & 0x200) << 6);

    // f32[2](z) significand 9-14 | significand 15
    uint16Array[4] = ((uint16Array[10] & 0xfc00) >> 2) | (uint16Array[11] << 15);
    // f32[2](z) significand 16-22 | exponent 23-28 | sign
    uint16Array[5] = ((uint16Array[11] & 0xfe) >> 1) | (zExponent << 7) | (uint16Array[11] & 0x8000);

    const [x, y, z] = float32Array;
    return { x, y, z };
  }
  /** As fast as `packInt21`
   *
   * 0% collisions on 10m unique clustered inputs each of small int, small float, large int, large float */
  static hash(value: Point3DLike): number {
    // fill out the significand. there's probably a better way to do this
    float64Array[0] = value.x * Math.LOG2E;
    float64Array[1] = value.y * Math.PI;
    float64Array[2] = value.z * Math.LN2;

    // mix f64[0] (uint16[0-3]), f64[1] (uint16[4-7]), and f64[2] (uint16[8-11]) into f64[3] (uint16[12-15])
    // the `Point2D` version of this is easier to parse
    uint16Array[12] = uint16Array[0] ^ uint16Array[5] ^ uint16Array[10] ^ (uint16Array[1] * 3) ^ (uint16Array[6] * 5) ^ (uint16Array[11] * 7);
    uint16Array[13] = uint16Array[1] ^ uint16Array[6] ^ uint16Array[11] ^ (uint16Array[2] * 9) ^ (uint16Array[7] * 11) ^ (uint16Array[8] * 13);
    uint16Array[14] = uint16Array[2] ^ uint16Array[7] ^ uint16Array[8] ^ (uint16Array[3] * 15) ^ (uint16Array[4] * 17) ^ (uint16Array[9] * 19);
    uint16Array[15] = uint16Array[3] ^ uint16Array[4] ^ uint16Array[9] ^ (uint16Array[0] * 21) ^ (uint16Array[5] * 23) ^ (uint16Array[10] * 25);

    // if all the exponent bits are on, the entire f64 is invalid and NaN is returned.
    // https://en.wikipedia.org/wiki/Double-precision_floating-point_format
    // xor the top exponent bit somewhere else
    uint16Array[14] ^= uint16Array[15] & 0x4000;
    // then turn it off
    uint16Array[15] &= 0xbfff;
    return float64Array[3];
  }
}
