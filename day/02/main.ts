import { parseArgs } from '@/lib/args.0.ts';
import { Logger } from '@/lib/logger.0.ts';

type Complex = [x: number, y: number];

function add(a: Complex, b: Complex): Complex {
  return [a[0] + b[0], a[1] + b[1]];
}

function mult(a: Complex, b: Complex): Complex {
  return [
    a[0] * b[0] - a[1] * b[1],
    a[0] * b[1] + a[1] * b[0],
  ];
}

function div(a: Complex, b: Complex): Complex {
  return [
    Math.trunc(a[0] / b[0]),
    Math.trunc(a[1] / b[1]),
  ];
}

function part1(input: Complex, logger: Logger) {
  let result: Complex = [0, 0];
  for (let i = 0; i < 3; ++i) {
    result = mult(result, result);
    logger.debugLow(i, 'mult', result);
    result = div(result, [10, 10]);
    logger.debugLow(i, 'div', result);
    result = add(result, input);
    logger.debugLow(i, 'add', result);
  }
  // [125233,708620]
  logger.success('result', `[${result[0]},${result[1]}]`);
}

function part2(input: Complex, logger: Logger) {
  const resolution = 101;
  const size = 1000;
  let engraveCount = 0;
  for (let y = 0; y < resolution; ++y) {
    for (let x = 0; x < resolution; ++x) {
      const point = add(input, [x * size / (resolution - 1), y * size / (resolution - 1)]);
      let result: Complex = [0, 0];

      for (let i = 0; i < 100; ++i) {
        result = mult(result, result);
        result = div(result, [100000, 100000]);
        result = add(result, point);
        // logger.debugMed({ x, y, point, i, result });
        if (
          result[0] < -1000000 || result[0] > 1000000 || result[1] < -1000000 && result[1] > 1000000
        ) { break; }
      }

      const shouldEngrave = result[0] >= -1000000 && result[0] <= 1000000 && result[1] >= -1000000 && result[1] <= 1000000;
      if (shouldEngrave) ++engraveCount;
      logger.debugLow({ x, y, result, shouldEngrave });
    }
  }
  // 1584
  logger.success('engraveCount', engraveCount);
}

function part3(input: Complex, logger: Logger) {
  const resolution = 1001;
  const size = 1000;
  let engraveCount = 0;
  for (let y = 0; y < resolution; ++y) {
    for (let x = 0; x < resolution; ++x) {
      const point = add(input, [x * size / (resolution - 1), y * size / (resolution - 1)]);
      let result: Complex = [0, 0];

      for (let i = 0; i < 100; ++i) {
        result = mult(result, result);
        result = div(result, [100000, 100000]);
        result = add(result, point);
        // logger.debugMed({ x, y, point, i, result });
        if (
          result[0] < -1000000 || result[0] > 1000000 || result[1] < -1000000 && result[1] > 1000000
        ) { break; }
      }

      const shouldEngrave = result[0] >= -1000000 && result[0] <= 1000000 && result[1] >= -1000000 && result[1] <= 1000000;
      if (shouldEngrave) ++engraveCount;
      logger.debugLow({ x, y, result, shouldEngrave });
    }
  }
  // 155348
  logger.success('engraveCount', engraveCount);
}

function main() {
  const { data, logger, part } = parseArgs(import.meta.url);
  const match = /A=\[(-?\d+),(-?\d+)\]/.exec(data);
  if (!match) throw new Error('could not parse input');
  const input: Complex = [
    parseInt(match[1]),
    parseInt(match[2]),
  ];
  logger.debugLow({ data, input });
  if (part === 1) part1(input, logger.makeChild('part1'));
  if (part === 2) part2(input, logger.makeChild('part2'));
  if (part === 3) part3(input, logger.makeChild('part3'));
}

main();
