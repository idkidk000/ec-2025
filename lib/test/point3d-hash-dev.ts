// deno-lint-ignore-file no-unused-vars
import { Point3D, Point3DLike } from '@/point3d.0.ts';
import { HashedSet } from '@/hashed-set.0.ts';

const [runs, length] = Deno.args.includes('-vfast') ? [1, 1000] : Deno.args.includes('-fast') ? [5, 1_000_000] : [10, 10_000_000];

const tests = ['smallInt', 'smallFloat', 'largeInt', 'largeFloat'] as const;
type Test = (typeof tests)[number];

const makePoints = (test: Test): Point3DLike[] => {
  const make = () => {
    switch (test) {
      case 'largeFloat':
        return (Math.random() - 0.5) * Number.MAX_SAFE_INTEGER;
      case 'largeInt':
        return Math.round((Math.random() - 0.5) * Number.MAX_SAFE_INTEGER);
      case 'smallFloat':
        return (Math.random() - 0.5) * 2 * 10_000;
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
        set.add(point);
        if (set.size === length) break;
      }
    }
    return [...set];
  }
};

const float64Array = new Float64Array(6);
const u16 = new Uint16Array(float64Array.buffer);
const m = [3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31, 33, 35, 37, 39, 41, 43];

const results = new Map<Test, number>();

for (const test of tests) {
  const input = makePoints(test);
  const set = new Set();
  for (const [i, item] of input.entries()) {
    float64Array[0] = item.x * Math.LOG2E;
    float64Array[1] = item.y * Math.PI;
    float64Array[2] = item.z * Math.LN2;
    //f64s are uint16[0-11]

    // deno-lint-ignore single-var-declarator
    const F0 = 0, F1 = 4, F2 = 8, F4 = 16;

    // uint64[4] is uint16[16-19]
    u16[16] = u16[F0 + 0] ^ u16[F1 + 1] ^ u16[F2 + 2] ^ (u16[F0 + 1] * m[0]) ^ (u16[F1 + 2] * m[1]) ^ (u16[F2 + 3] * m[2]);
    u16[17] = u16[F0 + 1] ^ u16[F1 + 2] ^ u16[F2 + 3] ^ (u16[F0 + 2] * m[3]) ^ (u16[F1 + 3] * m[4]) ^ (u16[F2 + 0] * m[5]);
    u16[18] = u16[F0 + 2] ^ u16[F1 + 3] ^ u16[F2 + 0] ^ (u16[F0 + 3] * m[6]) ^ (u16[F1 + 0] * m[7]) ^ (u16[F2 + 1] * m[8]);
    u16[19] = u16[F0 + 3] ^ u16[F1 + 0] ^ u16[F2 + 1] ^ (u16[F0 + 0] * m[9]) ^ (u16[F1 + 1] * m[10]) ^ (u16[F2 + 2] * m[11]);

    // const hash = uint64Array[4];
    // if the exponent part is all on, the entire f64 is invalid and NaN is returned.
    // https://en.wikipedia.org/wiki/Double-precision_floating-point_format
    // xor the top exponent bit somewhere else
    u16[F4 + 2] ^= u16[F4 + 3] & 0x4000;
    // then turn it off
    u16[F4 + 3] &= 0xbfff;
    const hash = float64Array[4];

    if (set.has(hash)) {
      const rate = (i + 1 - set.size) / (i + 1);
      // console.log(test, 'collision', `${rate * 100}%`, hash, item);
    } else { set.add(hash); }
  }
  const rate = (input.length - set.size) / input.length;
  // deno-lint-ignore no-console
  console.log(test, 'total rate', `${rate * 100}%`);
  results.set(test, rate);
}

// deno-lint-ignore no-console
results.entries().forEach(([test, rate]) => console.log('final', test, `${rate * 100}%`));
