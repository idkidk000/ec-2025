import { Logger } from '@/lib/logger.0.ts';
import { spawnSync } from 'node:child_process';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, sep } from 'node:path';
import { argv } from 'node:process';

const readmeFile = 'readme.md';
const benchmarksFile = 'meta/benchmarks.json';
const daysFile = 'meta/days.json';
const parts = 3;
const runs = 3;

const logger = new Logger(import.meta.url);

const wantedDays = argv.length > 2 ? argv.slice(2).map((token) => parseInt(token)) : null;

const files = (await readdir('day', { encoding: 'utf-8', recursive: true, withFileTypes: true }))
  .filter((entry) => entry.isFile() && entry.name === 'main.ts')
  .map(({ parentPath, name }) => ({
    day: parseInt(parentPath.split(sep).at(-1) ?? ''),
    path: join(parentPath, name),
  }))
  .toSorted((a, b) => a.path.localeCompare(b.path, undefined, { sensitivity: 'base' }));

logger.info({ wantedDays, files });

const benchmarks: Record<number, Record<number, number>> = JSON.parse(await readFile(benchmarksFile, { encoding: 'utf-8' }).catch(() => '{}'));
const names: Record<number, string> = JSON.parse(await readFile(daysFile, { encoding: 'utf-8' }));

for (const file of files) {
  if (wantedDays === null && file.day in benchmarks) continue;
  if (wantedDays !== null && !wantedDays.includes(file.day)) continue;
  const result: Record<number, number> = {};
  for (let part = 1; part <= parts; ++part) {
    const [command, ...args] = ['deno', 'run', '-R', file.path, '-p', String(part)];
    for (let run = 0; run < runs; ++run) {
      await new Promise((resolve) => setTimeout(resolve, 1_000));
      const started = performance.now();
      const { status } = spawnSync(command, args, { stdio: 'inherit' });
      const duration = status === 0 ? performance.now() - started : 0;
      result[part] = Math.min(result[part] ?? duration, duration);
    }
  }
  logger.info(file, Object.fromEntries(Object.entries(result).map(([part, millis]) => [part, parseFloat((millis / 1000).toFixed(3))])));
  benchmarks[file.day] = result;
}

await writeFile(benchmarksFile, JSON.stringify(benchmarks, null, 2), { encoding: 'utf-8' });

const markdown = `### Benchmarks\n\n| Day | ${Array.from({ length: parts }, (_, i) => `Part ${i + 1}`).join(' | ')} |\n| ${
  Array.from({ length: parts + 1 }, () => '---').join(' | ')
} |\n${
  files.map(({ day, path }) => {
    const result = benchmarks[day];
    const name = names[day] ?? '???';
    return `| [${day.toString().padStart(2, '0')} - ${name}](${path}) | ${
      Array.from({ length: parts }, (_, i) => result && result[i + 1] > 0 ? `${(result[i + 1] / 1000).toFixed(3)}s` : '-').join(' | ')
    } |`;
  }).join('\n')
}`;

logger.plain(markdown);

const readme = await readFile(readmeFile, { encoding: 'utf-8' });
await writeFile(readmeFile, `${readme.replace(/^### Benchmarks.*$/sm, '')}${markdown}`);
spawnSync('deno', ['fmt', readmeFile]);
