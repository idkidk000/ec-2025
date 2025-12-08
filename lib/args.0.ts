import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Logger } from './logger.0.ts';

const BASE_DEFAULTS = {
  fileName: 'input.txt',
  logLevel: 0,
  part: 0,
};
type Defaults = typeof BASE_DEFAULTS;

/** Parses the following args:
 * - `-f` `fileName` loads puzzle input from `fileName(\.txt)?`. Default `input.txt`
 * - `-l` `logLevel` sets log level from `0` - `Debug:High` to `6` - `Error`. Default `0`
 * - `-p` `part` selects which part of the puzzle to run - `1` is `part1`, `2` is `part2`, other is `both`. Default `0`
 */
export function parseArgs(importMetaUrl: string, defaults?: Partial<Defaults>) {
  const parsed: Defaults = {
    ...BASE_DEFAULTS,
    ...defaults,
  };
  const raw = [...Deno.args];
  while (raw.length) {
    const key = raw.shift();
    if (typeof key === 'undefined') break;
    if (!['-f', '-l', '-p'].includes(key)) throw new Error(`unknown arg ${key}`);
    const val = raw.shift();
    if (typeof val === 'undefined') throw new Error(`missing value for arg ${key}`);
    if (key === '-f') parsed.fileName = `${val.replace(/\.txt$/, '')}.txt`;
    if (key === '-l') parsed.logLevel = parseInt(val);
    if (key === '-p') parsed.part = parseInt(val);
  }
  const filePath = join(dirname(fileURLToPath(importMetaUrl)), parsed.fileName);
  const data = readFileSync(filePath, { encoding: 'utf-8' });
  const logger = new Logger(importMetaUrl, undefined, { logLevel: parsed.logLevel });
  logger.debugLow(parsed);
  return { ...parsed, data, part1: parsed.part !== 2, part2: parsed.part !== 1, logger };
}
