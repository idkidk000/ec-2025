import { Console } from 'node:console';
import { HashedSet } from '@/hashed-set.0.ts';
import { Point2D } from '@/point2d.0.ts';
import { stderr, stdout } from 'node:process';

const console = new Console({
  colorMode: true,
  inspectOptions: { breakLength: 500, depth: 10, maxStringLength: 150, numericSeparator: true, sorted: false },
  stderr,
  stdout,
});

const length = 1_000_000;
// const length = 10;
const tests = ['smallInt', 'largeInt', 'smallFloat', 'largeFloat'] as const;
type Test = (typeof tests)[number];

const make = (test: Test) => {
  switch (test) {
    case 'smallInt':
      return Math.round((Math.random() - 0.5) * 2 * Math.max(length / 10, 100));
    case 'largeInt':
      return Math.round((Math.random() - 0.5) * 2 * Number.MAX_SAFE_INTEGER);
    case 'smallFloat':
      return (Math.random() - 0.5) * 2 * length / 10;
    case 'largeFloat':
      return (Math.random() - 0.5) * 2 * Number.MAX_SAFE_INTEGER;
  }
};

const float64Array = new Float64Array(2);
const uint32Array = new Uint32Array(float64Array.buffer);
// const uint16Array = new Uint16Array(float64Array.buffer);

for (const test of tests) {
  console.log('\n', test);
  const input = new HashedSet(Point2D.pack);
  const output = new Set();

  while (input.size < length) input.add({ x: make(test), y: make(test) });
  for (const { x, y } of input) {
    float64Array[0] = x * 1.03;
    float64Array[1] = y * 1.05;

    // TODO: extract to 8x uint16s, multiply by primes just below 1<<bit i want to map to, verify xor behaviour
    // << wraps at 32 bits so it seems possible that ^ is broken above 32 bits too
    // might have to right shift, xor, then left shift. idk?

    // // shifting doesn't work above 32 bits
    // const shifted = [...uint16Array].map((v, i) => v << (i * 5));
    // const hash = shifted.reduce((acc, item) => acc ^ item, 0);
    // // console.log(
    // //   { x, y },
    // //   '\n        ',
    // //   [...uint16Array].map((v) => v.toString(16).padStart(4, ' ')).join(' | '),
    // //   '\n        ',
    // //   shifted.map((v) => v.toString(16).padStart(13, ' ')).join(' | '),
    // //   '\n        ',
    // //   hash,
    // // );

    const parts = [...uint32Array];
    // [0] and [2] are empty for small ints. try to spread the 32 bit values out evenly over 56 bits
    const primed = parts.map((v, i) => v * (i === 0 ? 251 : i === 1 ? 16_777_213 : i === 2 ? 65_521 : 1));
    const hash = primed.reduce((acc, item) => acc ^ item, 0);
    // const widths = primed.map((v) => v === 0 ? 0 : Math.ceil(Math.log2(v)));
    // console.log(
    //   { x: x.toString(16), y: x.toString(16) },
    //   '\n        ',
    //   parts.map((v) => v.toString(16).padStart(14, ' ')),
    //   '\n        ',
    //   primed.map((v) => v.toString(16).padStart(14, ' ')),
    //   '\n        ',
    //   widths.map((v) => v.toString().padStart(14, ' ')),
    //   hash.toString(16).padStart(8, ' '),
    // );

    output.add(hash);
  }

  const collisions = input.size - output.size;
  const rate = collisions / input.size;
  console.log(
    test,
    'input',
    input.size.toLocaleString(),
    'output',
    output.size.toLocaleString(),
    'collisions',
    collisions.toLocaleString(),
    'rate',
    rate * 100,
    '%',
  );
}
