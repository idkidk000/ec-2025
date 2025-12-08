// deno-lint-ignore-file no-console no-unused-vars
import { Point3D, Point3DLike } from '@/point3d.0.ts';
import { HashedSet } from '@/hashed-set.0.ts';
import { Utils } from '@/utils.0.ts';

const [runs, length] = Deno.args.includes('-vfast') ? [1, 1000] : Deno.args.includes('-fast') ? [5, 1_000_000] : [10, 10_000_000];

const tests = [
  'smallInt',
  // 'smallFloat',
  // 'largeInt',
  // 'largeFloat'
] as const;
type Test = (typeof tests)[number];

const makePoints = (test: Test): Point3DLike[] => {
  const make = () => {
    switch (test) {
      case 'largeFloat':
        return Utils.roundTo((Math.random() - 0.5) * Number.MAX_SAFE_INTEGER, 1);
      case 'largeInt':
        return Math.round((Math.random() - 0.5) * Number.MAX_SAFE_INTEGER);
      case 'smallFloat':
        return Utils.roundTo((Math.random() - 0.5) * 2 * 4095, 1);
      // case 'smallInt':
      //   return Math.round((Math.random() - 0.5) * 2 * (length / 100));
      default:
        throw new Error(`invalid makePoints test: ${test}`);
    }
  };
  if (test === 'smallInt') {
    const arr: Point3DLike[] = [];
    const bound = Math.ceil(Math.cbrt(length) / 2);
    for (let x = -bound; x < bound; ++x) {
      for (let y = -bound; y < bound; ++y) {
        for (let z = -bound; z < bound; ++z) {
          arr.push({ x, y, z });
          if (arr.length === length) return arr;
        }
      }
    }
    throw new Error('did not generate smallInt input array');
  } else {
    const set = new HashedSet(Point3D.pack);
    while (set.size < length) {
      const center = { x: make(), y: make(), z: make() };
      for (const point of [center, ...Point3D.neighbours(center, 26)]) {
        if (set.size === length) break;
        set.add(point);
      }
    }
    return [...set];
  }
};

const float32Array = new Float32Array(6);
const uint16Array = new Uint16Array(float32Array.buffer);
const float64Array = new Float64Array(float32Array.buffer);

function packFloat21(value: Point3DLike): number {
  float32Array[0] = value.x;
  float32Array[1] = value.y;
  float32Array[2] = value.z;

  // f32 has 8 exponent and 23 significand bits
  // f16 has 5 exponent and 10 significand bits
  // f21 can have 6 exponent and 14 significand bits i suppose. probably ought to test a bit

  // f32 structure:
  //   0-22 : l0-15, h0-7: significand (we want 9-22)
  //   23-30: h7-14      : exponent (we want 23-28)
  //   31   : h15        : sign

  // f21 structure
  //   0-13 significand
  //   14-19 exponent
  //   20: sign

  // read the whole exponent, remove 8-bit bias, add 6-bit bias, mask to 6 bits
  const xExponent = (((uint16Array[1] & 0x7f80) >> 7) - 96) & 0x3f;
  const yExponent = (((uint16Array[3] & 0x7f80) >> 7) - 96) & 0x3f;
  const zExponent = (((uint16Array[5] & 0x7f80) >> 7) - 96) & 0x3f;

  // pack from u16[0-1,2-3,4-5] to u16[8-11]

  // f32[0](x) significand 9-15 | f32[0](x) significand 16-22, exponent 23-24
  // uint16Array[8] = (uint16Array[0] >> 9) | (uint16Array[1] << 7);
  uint16Array[8] = (uint16Array[0] >> 9) | ((uint16Array[1] & 0x7f) << 7) | (xExponent << 14);

  // f32[0](x) exponent 25-28 | f32[0](x) sign | f32[1](y) significand 9-15 | f32[1](y) significand 16-19
  // uint16Array[9] = ((uint16Array[1] & 0x1e00) >> 9) | ((uint16Array[1] & 0x8000) >> 11) | ((uint16Array[2] & 0xfe00) >> 4) | (uint16Array[3] << 12);
  uint16Array[9] = (xExponent >> 2) | ((uint16Array[1] & 0x8000) >> 11) | ((uint16Array[2] & 0xfe00) >> 4) | (uint16Array[3] << 12);

  // f32[1](y) significand 20-22, exponent 23-28 | f32[1](y) sign | f32[2](z) significand 9-14
  // uint16Array[10] = ((uint16Array[3] & 0x1ff0) >> 4) | ((uint16Array[3] & 0x8000) >> 6) | ((uint16Array[4] & 0x7e00) << 1);
  uint16Array[10] = ((uint16Array[3] & 0x70) >> 4) | (yExponent << 3) | ((uint16Array[3] & 0x8000) >> 6) | ((uint16Array[4] & 0x7e00) << 1);

  // f32[2](z) significand 15 | f32[2](z) significand 16-22, exponent 23-28 | off (NaN) | f32[2](z) sign
  // uint16Array[11] = (uint16Array[4] >> 15) | ((uint16Array[5] & 0x1fff) << 1) | (uint16Array[5] & 0x8000);
  uint16Array[11] = (uint16Array[4] >> 15) | ((uint16Array[5] & 0x7f) << 1) | (zExponent << 8) | (uint16Array[5] & 0x8000);

  console.log('packf21', value);
  uint16Array.forEach((item, i) => console.log('  ', i.toString().padEnd(2, ' '), item.toString(2).padStart(16, '.')));

  return float64Array[2];
}
function unpackFloat21(value: number): Point3DLike {
  float64Array[2] = value;
  // float64Array[0] = 0;
  // float64Array[1] = 0;

  const xExponent = ((uint16Array[8] >> 14) | ((uint16Array[9] & 0xf) << 2)) + 96;
  const yExponent = ((uint16Array[10] & 0x1f8) >> 3) + 96;
  const zExponent = ((uint16Array[11] & 0x3f00) >> 8) + 96;

  // unpack from u16[8-11] to u16[0-1,2-3,4-5]
  // f32[0](x) significand 9-15
  uint16Array[0] = uint16Array[8] << 9;
  // f32[0](x) significand 16-22, exponent 23-24 | exponent 25-28 | base exponent 29-30 (0,1) | sign
  // uint16Array[1] = (uint16Array[8] >> 7) | ((uint16Array[9] & 0xf) << 9) | 0x2000 | ((uint16Array[9] & 0x10) << 11);
  uint16Array[1] = ((uint16Array[8] & 0x3f80) >> 7) | (xExponent << 7) | ((uint16Array[9] & 0x10) << 11);

  // f32[1](y) significand 9-15
  uint16Array[2] = (uint16Array[9] & 0xfe0) << 4;
  // f32[1](y) significand 16-19 | significand 20-22, exponent 23-28 | base exponent 29-30 (1,0) | sign
  // uint16Array[3] = (uint16Array[9] >> 12) | ((uint16Array[10] & 0x1ff) << 4) | 0x4000 | ((uint16Array[10] & 0x200) << 6);
  uint16Array[3] = (uint16Array[9] >> 12) | ((uint16Array[10] & 0x7) << 4) | (yExponent << 7) | ((uint16Array[10] & 0x200) << 6);

  // f32[2](z) significand 9-14 | significand 15
  uint16Array[4] = ((uint16Array[10] & 0xfc00) >> 2) | (uint16Array[11] << 15);
  // f32[2](z) significand 16-22, exponent 23-28 | base exponent 29-30 (1,0) | sign
  // uint16Array[5] = ((uint16Array[11] & 0x3ffe) >> 1) | 0x4000 | (uint16Array[11] & 0x8000);
  uint16Array[5] = ((uint16Array[11] & 0xfe) >> 1) | (zExponent << 7) | (uint16Array[11] & 0x8000);

  console.log('unpackf21', value);
  uint16Array.forEach((item, i) => console.log('  ', i.toString().padEnd(2, ' '), item.toString(2).padStart(16, '.')));

  const [x, y, z] = float32Array;
  return { x, y, z };
}

// const value = -((1 << 10) - 1); //1 | (1 << 3) | (1 << 5) | (1 << 7) | (1 << 9) | (1 << 11) | (1 << 13) | (1 << 15) | (1 << 17) | (1 << 19);

// const input: Point3DLike[] = [
//   { x: value, y: 0, z: 0 },
//   { x: 0, y: value, z: 0 },
//   { x: 0, y: 0, z: value },
// ];

// for (const item of input) {
//   const packed = packInt21(item);
//   const unpacked = unpackInt21(packed);
//   console.log(item, 'packed', packed, 'unpacked', unpacked);
// }

// for (const item of [{ x: -3.875, y: 3.875, z: -2.25 }] satisfies Point3DLike[]) {
//   const packed = packFloat21(item);
//   const unpacked = unpackFloat21(packed);
//   // this is failing because the exponent has been truncated. it's possible that i need to truncate from the other end
//   console.log(item, packed, unpacked);
// }

// const points = makePoints('smallFloat');
// for (const [i, item] of points.entries()) {
//   // const packedLocal = packInt21(item);
//   const packedClass = Point3D.packFloat21(item);
//   // console.log(i, packedLocal === packedClass, packedLocal, packedClass);
//   // const unpackedLocal = unpackInt21(packedLocal);
//   const unpackedClass = Point3D.unpackFloat21(packedClass);
//   // const localEq = Point3D.eq(item, unpackedLocal);
//   const classEq = Point3D.eq(item, unpackedClass);
//   // console.error(i, { localEq, classEq }, item, unpackedLocal, unpackedClass);
//   console.error(i, classEq, item, unpackedClass);
// }

// exit(1);
const results = new Map<Test, number>();

for (const test of tests) {
  const input = makePoints(test);
  let errors = 0;
  for (const item of input) {
    const packed = Point3D.packInt21(item);
    const unpacked = Point3D.unpackInt21(packed);
    const eq = Point3D.isEqual(item, unpacked);
    console.log(item, 'unpacked', unpacked, 'eq', eq);
    if (!eq) ++errors;
  }
  const rate = errors / (input.length || 1);
  console.log(test, 'total rate', `${rate * 100}%`);
  results.set(test, rate);
}

console.log({ length });
results.entries().forEach(([test, rate]) => console.log('final', test, `${rate * 100}%`));
