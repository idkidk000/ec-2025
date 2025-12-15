import { spawn } from 'node:child_process';
import { copyFile, mkdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { Logger } from '@/lib/logger.0.ts';

const exists = async (path: string) => {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
};

const template = 'meta/template.ts';
const editor = ['flatpak', 'run', 'com.vscodium.codium'];

const logger = new Logger(import.meta.url);
const day = parseInt(Deno.args.at(0) ?? '');
const part = parseInt(Deno.args.at(1) ?? '1');
if (isNaN(day)) throw new Error('missing required day number arg');

const textFiles = [`sample${part}.txt`, `part${part}.txt`];
const directory = join('day', day.toString().padStart(2, '0'));
const main = join(directory, 'main.ts');

await mkdir(directory, { recursive: true });
if (await exists(main)) logger.warn(main, 'already exists');
else {
  await copyFile(template, main);
  logger.success('created', main);
}

const [command, ...args] = [...editor, main, ...textFiles.map((name) => join(directory, name))];
spawn(command, args);
logger.info(command, ...args);
