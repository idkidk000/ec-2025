import { EcArgParser } from '@/lib/args.1.ts';
import { Logger } from '@/lib/logger.0.ts';

type Rules = Map<string, Set<string>>;

function validate(name: string, rules: Rules, logger: Logger): boolean {
  for (let current = 0; current < name.length - 1; ++current) {
    const next = current + 1;
    const allowedNext = rules.get(name[current]);
    if (!allowedNext?.has(name[next])) {
      logger.debugMed({ name, current, next, currentVal: name[current], nextVal: name[next], allowedNext });
      return false;
    }
  }
  return true;
}

function part1(names: string[], rules: Rules, logger: Logger) {
  const found = names.find((name) => validate(name, rules, logger));
  // Urardith
  logger.success('found', found);
}

function part2(names: string[], rules: Rules, logger: Logger) {
  const total = names.reduce((acc, name, i) => acc + (validate(name, rules, logger) ? i + 1 : 0), 0);
  // 1693
  logger.success('total', total);
}

function part3(roots: string[], rules: Rules, logger: Logger) {
  /** includes invalid */
  const counted = new Set<string>();

  /** counts valid name combinations for the given root */
  function count(root: string): number {
    if (counted.has(root)) return 0;
    counted.add(root);
    if (root.length === 11) return 1;
    let combos = root.length >= 7 ? 1 : 0;
    const rule = rules.get(root[root.length - 1]);
    if (rule) { for (const next of rule) combos += count(`${root}${next}`); }
    return combos;
  }

  const total = roots
    .filter((root) => validate(root, rules, logger))
    .reduce((acc, root) => acc + count(root), 0);
  // 8125579
  logger.success('total', total);
}

function main() {
  const { data, logger, part } = new EcArgParser(import.meta.url);
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
