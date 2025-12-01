import { parseArgs } from '@/lib/args.0.ts';
import { Logger } from '@/lib/logger.0.ts';
import { inspect } from 'node:util';

type ComplexParams = [complex: Complex] | [x: number, y: number];

class Complex {
  #x: number;
  #y: number;
  constructor(...[p0, p1]: ComplexParams) {
    if (p0 instanceof Complex) {
      this.#x = p0.x;
      this.#y = p0.y;
    } else if (typeof p1 === 'number') {
      this.#x = p0;
      this.#y = p1;
    } else { throw new Error('bad constructor params'); }
  }
  public get x() {
    return this.#x;
  }
  public get y() {
    return this.#y;
  }
  /** mutate in-place */
  add(...[p0, p1]: ComplexParams): this {
    if (p0 instanceof Complex) {
      this.#x += p0.x;
      this.#y += p0.y;
    } else if (typeof p1 === 'number') {
      this.#x += p0;
      this.#y += p1;
    }
    return this;
  }
  /** mutate in-place */
  mult(...[p0, p1]: ComplexParams): this {
    if (p0 instanceof Complex) {
      const x = this.x * p0.x - this.y * p0.y;
      const y = this.x * p0.y + this.y * p0.x;
      this.#x = x;
      this.#y = y;
    } else if (typeof p1 === 'number') {
      const x = this.x * p0 - this.y * p1;
      const y = this.x * p1 + this.y * p0;
      this.#x = x;
      this.#y = y;
    }
    return this;
  }
  /** mutate in-place */
  div(...[p0, p1]: ComplexParams): this {
    if (p0 instanceof Complex) {
      this.#x = Math.trunc(this.x / p0.x);
      this.#y = Math.trunc(this.y / p0.y);
    } else if (typeof p1 === 'number') {
      this.#x = Math.trunc(this.x / p0);
      this.#y = Math.trunc(this.y / p1);
    }
    return this;
  }
  [inspect.custom]() {
    return `[${this.x},${this.y}]`;
  }
}

function getEngraveCount(input: Complex, size: number, resolution: number, logger: Logger): number {
  let engraveCount = 0;
  for (let y = 0; y < resolution; ++y) {
    for (let x = 0; x < resolution; ++x) {
      const point = new Complex(input).add(x * size / (resolution - 1), y * size / (resolution - 1));
      const result = new Complex(0, 0);
      let shouldEngrave = true;

      for (let i = 0; shouldEngrave && i < 100; ++i) {
        result.mult(result);
        result.div(100000, 100000);
        result.add(point);
        if (
          result.x < -1000000 || result.x > 1000000 || result.y < -1000000 || result.y > 1000000
        ) { shouldEngrave = false; }
      }

      if (shouldEngrave) ++engraveCount;
      logger.debugLow({ x, y, result, shouldEngrave });
    }
  }
  return engraveCount;
}

function part1(input: Complex, logger: Logger) {
  const value = new Complex(0, 0);
  for (let i = 0; i < 3; ++i) {
    value.mult(value);
    logger.debugLow(i, 'mult', value);
    value.div(10, 10);
    logger.debugLow(i, 'div', value);
    value.add(input);
    logger.debugLow(i, 'add', value);
  }
  // [125233,708620]
  logger.success('result', value);
}

function part2(input: Complex, logger: Logger) {
  const engraveCount = getEngraveCount(input, 1000, 101, logger);
  // 1584
  logger.success('engraveCount', engraveCount);
}

function part3(input: Complex, logger: Logger) {
  const engraveCount = getEngraveCount(input, 1000, 1001, logger);
  // 155348
  logger.success('engraveCount', engraveCount);
}

function main() {
  const { data, logger, part } = parseArgs(import.meta.url);
  const match = /A=\[(?<x>-?\d+),(?<y>-?\d+)\]/.exec(data);
  if (!match?.groups) throw new Error('could not parse input');
  const input = new Complex(parseInt(match.groups.x), parseInt(match.groups.y));
  logger.debugLow({ data, input });
  if (part === 1) part1(input, logger.makeChild('part1'));
  if (part === 2) part2(input, logger.makeChild('part2'));
  if (part === 3) part3(input, logger.makeChild('part3'));
}

main();
