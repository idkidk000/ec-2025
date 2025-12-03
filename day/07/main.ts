import { parseArgs } from '@/lib/args.0.ts';
import { Logger } from '@/lib/logger.0.ts';

function part1(names: string[], rules: Map<string, Set<string>>, logger: Logger) {
  let found: string | null = null;
  for (const name of names) {
    let valid = true;
    for (let current = 0; valid && current < name.length - 1; ++current) {
      const next = current + 1;
      const allowedNext = rules.get(name[current]);
      if (!allowedNext?.has(name[next])) {
        logger.debugLow({ name, current, next, currentVal: name[current], nextVal: name[next], allowedNext });
        valid = false;
      }
    }
    if (valid) {
      found = name;
      break;
    }
  }
  // Urardith
  if (found) logger.success('found', found);
  else throw new Error('no valid name found');
}

function part2(names: string[], rules: Map<string, Set<string>>, logger: Logger) {
  let total = 0;
  for (const [nameIx, name] of names.entries()) {
    let valid = true;
    for (let current = 0; valid && current < name.length - 1; ++current) {
      const next = current + 1;
      const allowedNext = rules.get(name[current]);
      if (!allowedNext?.has(name[next])) {
        logger.debugMed({ name, current, next, currentVal: name[current], nextVal: name[next], allowedNext });
        valid = false;
      }
    }
    if (valid) {
      logger.debugLow('valid', name);
      total += nameIx + 1;
    }
  }
  // 1693
  logger.success('total', total);
}

function part3(prefixes: string[], rules: Map<string, Set<string>>, logger: Logger) {
  const names = new Set<string>();
  const validPrefixes = prefixes.filter((prefix) => {
    let valid = true;
    for (let current = 0; valid && current < prefix.length - 1; ++current) {
      const next = current + 1;
      const allowedNext = rules.get(prefix[current]);
      if (!allowedNext?.has(prefix[next])) valid = false;
    }
    logger.debugMed(`prefix${valid ? '' : ' not'} valid`, prefix);
    return valid;
  });

  function recurse(name: string): void {
    if (name.length >= 7) names.add(name);
    if (name.length === 11) return;
    // deno-lint-ignore no-non-null-assertion
    const rule = rules.get(name.at(-1)!);
    if (!rule) return;
    for (const letter of rule) recurse(`${name}${letter}`);
  }

  for (const prefix of validPrefixes) recurse(prefix);

  logger.debugLow('validPrefixes', validPrefixes);
  logger.debugLow('names', names);
  // 8125579
  logger.success('total', names.size);
}

function main() {
  const { data, logger, part } = parseArgs(import.meta.url);
  const parts = data.split('\n\n');
  const names = parts[0].split(',');
  const rules = parts[1].split('\n').map((line) => {
    const parent = line[0];
    const children = line.slice(4).split(',');
    return { parent, children };
  }).reduce((acc, item) => {
    acc.set(item.parent, new Set(item.children));
    return acc;
  }, new Map<string, Set<string>>());
  if (part === 1) part1(names, rules, logger.makeChild('part1'));
  if (part === 2) part2(names, rules, logger.makeChild('part2'));
  if (part === 3) part3(names, rules, logger.makeChild('part3'));
}

main();
