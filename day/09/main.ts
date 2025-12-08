import { EcArgParser } from '@/lib/args.1.ts';
import { Logger } from '@/lib/logger.0.ts';

interface Sequence {
  id: number;
  data: string;
}

function getSimilarity(child: Sequence, parents: [a: Sequence, b: Sequence], logger: Logger): number {
  const parentData = parents.map((parent) => ({ ...parent, similarity: 0 }));
  let valid = true;
  for (let d = 0; valid && d < child.data.length; ++d) {
    valid = false;
    for (const parent of parentData) {
      if (parent.data[d] === child.data[d]) {
        ++parent.similarity;
        valid = true;
      }
    }
    if (!valid) {
      logger.debugMed('invalid', { child, parentData });
      return 0;
    }
  }
  const similarity = parentData.reduce((acc, item) => acc * item.similarity, 1);
  logger.debugMed('found', { child, parentData, similarity });
  return similarity;
}

function part1(sequences: Sequence[], logger: Logger) {
  let best = 0;
  for (const child of sequences) {
    const parents = sequences.filter((parent) => parent.id !== child.id);
    const similarity = getSimilarity(child, [parents[0], parents[1]], logger);
    if (similarity > best) {
      logger.debugLow(child.id, parents.map((item) => item.id), similarity);
      best = similarity;
    }
  }
  // 5551
  logger.success('best', best);
}

function part2(sequences: Sequence[], logger: Logger) {
  const similarites: number[] = [];
  for (const [c, child] of sequences.entries()) {
    let found = false;
    for (let p0 = 0; !found && p0 < sequences.length; ++p0) {
      if (p0 === c) continue;
      for (let p1 = p0 + 1; !found && p1 < sequences.length; ++p1) {
        if (p1 === c) continue;
        const similarity = getSimilarity(child, [sequences[p0], sequences[p1]], logger);
        if (similarity) {
          found = true;
          similarites.push(similarity);
        }
      }
    }
  }
  const total = similarites.reduce((acc, item) => acc + item);
  // 328726
  logger.success('total', total);
}

function part3(sequences: Sequence[], logger: Logger) {
  const families: Set<number>[] = [];
  for (const [c, child] of sequences.entries()) {
    let foundParents = false;
    for (let p0 = 0; !foundParents && p0 < sequences.length; ++p0) {
      if (p0 === c) continue;
      for (let p1 = p0 + 1; !foundParents && p1 < sequences.length; ++p1) {
        if (p1 === c) continue;
        const similarity = getSimilarity(child, [sequences[p0], sequences[p1]], logger);
        if (similarity) {
          foundParents = true;
          // merge needs to be done iteratively
          families.push(new Set([child.id, sequences[p0].id, sequences[p1].id]));
        }
      }
    }
  }
  logger.debugLow('families', families);

  let found = true;
  while (found) {
    found = false;
    for (let f = 0; !found && f < families.length; ++f) {
      const family = families[f];
      for (let o = f + 1; !found && o < families.length; ++o) {
        const other = families[o];
        if (family.intersection(other).size) {
          families[f] = family.union(other);
          families.splice(o, 1);
          found = true;
        }
      }
    }
  }
  logger.debugLow('merged families', families);

  const largest = families.toSorted((a, b) => b.size - a.size)[0];
  const sum = [...largest].reduce((acc, item) => acc + item, 0);

  // 46301
  logger.success('sum', sum);
}

function main() {
  const { data, logger, part } = new EcArgParser(import.meta.url);
  const sequences = data.split('\n').map((line) => {
    const tokens = line.split(':');
    return { id: parseInt(tokens[0]), data: tokens[1] };
  });
  logger.debugHigh(sequences);
  if (part === 1) part1(sequences, logger.makeChild('part1'));
  if (part === 2) part2(sequences, logger.makeChild('part2'));
  if (part === 3) part3(sequences, logger.makeChild('part3'));
}

main();
