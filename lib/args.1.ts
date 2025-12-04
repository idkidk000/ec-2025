import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Logger } from '@/lib/logger.0.ts';

abstract class ArgParser {
  #logger: Logger;
  #importMetaUrl: string;
  constructor(
    importMetaUrl: string,
    logLevel: number,
    public readonly fileName: string,
    public readonly part: number,
  ) {
    this.#importMetaUrl = importMetaUrl;
    this.#logger = new Logger(importMetaUrl, undefined, { logLevel });
  }
  get logger() {
    return this.#logger;
  }
  get data(): string {
    const filePath = join(dirname(fileURLToPath(this.#importMetaUrl)), this.fileName);
    return readFileSync(filePath, { encoding: 'utf-8' });
  }
}

type ArgParserDefaults = { fileName: string; logLevel: number; part: number };

function parseArgs(): Partial<ArgParserDefaults> {
  const args = [...Deno.args].toReversed();
  const parsed: Partial<ArgParserDefaults> = {};
  while (args.length) {
    const key = args.pop();
    if (typeof key === 'undefined') break;
    if (!['-f', '-l', '-p'].includes(key)) throw new Error(`unknown arg ${key}`);
    const val = args.pop();
    if (typeof val === 'undefined') throw new Error(`missing value for arg ${key}`);
    if (key === '-f') parsed.fileName = `${val.replace(/\.txt$/, '')}.txt`;
    if (key === '-l') parsed.logLevel = parseInt(val);
    if (key === '-p') parsed.part = parseInt(val);
  }
  return parsed;
}

/** Parses the following args:
 * - `-f` `fileName` loads puzzle input from `fileName(\.txt)?`. Default `input.txt`
 * - `-l` `logLevel` sets log level from `0` - `Debug:High` to `6` - `Error`. Default `3` - `Info`
 * - `-p` `part` selects which part of the puzzle to run - `1` is `part1`, `2` is `part2`, other is `both`. Default `0`
 */
export class AocArgParser extends ArgParser {
  constructor(importMetaUrl: string, defaults?: Partial<ArgParserDefaults>) {
    const parsed: ArgParserDefaults = {
      fileName: 'input.txt',
      logLevel: 3,
      part: 0,
      ...defaults,
      ...parseArgs(),
    };
    super(importMetaUrl, parsed.logLevel, parsed.fileName, parsed.part);
  }
}

/** Parses the following args:
 * - `-f` `fileName` loads puzzle input from `fileName(\.txt)?`. Default `part${part}.txt`
 * - `-l` `logLevel` sets log level from `0` - `Debug:High` to `6` - `Error`. Default `3` - `Info`
 * - `-p` `part` selects which part of the puzzle to run - `1` is `part1`, etc. Default `1`
 */
export class EcArgParser extends ArgParser {
  constructor(importMetaUrl: string, defaults?: Partial<ArgParserDefaults>) {
    const parsed: Omit<ArgParserDefaults, 'fileName'> & { fileName?: string } = {
      logLevel: 3,
      part: 1,
      ...defaults,
      ...parseArgs(),
    };
    super(importMetaUrl, parsed.logLevel, parsed.fileName ?? `part${parsed.part}.txt`, parsed.part);
  }
}
