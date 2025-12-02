import { parseArgs } from '@/lib/args.0.ts';
import { Logger } from '@/lib/logger.0.ts';

enum Level {
  Novice,
  Mentor,
}
enum Profession {
  Swordfighting,
  Archery,
  Magic,
}
interface Person {
  id: number;
  level: Level;
  profession: Profession;
}

function countPairs(
  people: Person[],
  logger: Logger,
  predicate: (novice: Person, mentor: Person) => boolean = (novice, mentor) => novice.profession === mentor.profession && novice.id > mentor.id,
): number {
  const novices = people.filter(({ level }) => level === Level.Novice);
  const mentors = people.filter(({ level }) => level === Level.Mentor);
  let total = 0;
  for (const novice of novices) {
    const count = mentors.filter((mentor) => predicate(novice, mentor)).length;
    logger.debugMed(novice, count);
    total += count;
  }
  return total;
}

function part1(people: Person[], logger: Logger) {
  const total = countPairs(people.filter(({ profession }) => profession === Profession.Swordfighting), logger);
  // 167
  logger.success('total', total);
}

function part2(people: Person[], logger: Logger) {
  const total = countPairs(people, logger);
  // 3895
  logger.success('total', total);
}

function part3(people: Person[], logger: Logger) {
  const range: number = 1000; //1000
  const repeats: number = 1000; //1000

  const leader: Person[] = [];
  while (leader.length < range) leader.push(...people);
  const follower: Person[] = [];
  while (follower.length < range) follower.push(...people.slice(0, range - follower.length));
  const expanded = [...leader.slice(-range), ...people, ...follower].map((person, i) => ({ ...person, id: i }));

  logger.debugLow('leader', leader, leader.length);
  logger.debugLow('people', people, people.length);
  logger.debugLow('follower', follower, follower.length);
  logger.debugLow('expanded', expanded, expanded.length);

  // these don't account for repeats being 1
  // they also don't account for earlier and later middle entries which don't have access to the full expanded range on both sides
  // actual result is correct since people.length>range but fails on the examples
  const first = countPairs(expanded, logger, (novice, mentor) =>
    novice.id >= range &&
    novice.id < range + people.length &&
    mentor.id >= range &&
    mentor.profession === novice.profession &&
    mentor.id >= novice.id - range &&
    mentor.id <= novice.id + range);

  const middle = countPairs(expanded, logger, (novice, mentor) =>
    novice.id >= range &&
    novice.id < range + people.length &&
    mentor.profession === novice.profession &&
    mentor.id >= novice.id - range &&
    mentor.id <= novice.id + range);

  const last = countPairs(expanded, logger, (novice, mentor) =>
    novice.id >= range &&
    novice.id < range + people.length &&
    mentor.id < range + people.length &&
    mentor.profession === novice.profession &&
    mentor.id >= novice.id - range &&
    mentor.id <= novice.id + range);

  logger.debugLow({ first, middle, last });
  const total = first + middle * (repeats - 2) + last;

  // 1667903460
  logger.success('total', total);
}

function main() {
  const { data, logger, part } = parseArgs(import.meta.url);
  const people = data.split('').map((token, i) => {
    const upper = token.toUpperCase();
    return {
      id: i,
      level: upper === token ? Level.Mentor : Level.Novice,
      profession: upper === 'A' ? Profession.Swordfighting : upper === 'B' ? Profession.Archery : Profession.Magic,
    };
  });
  logger.debugLow(people);
  if (part === 1) part1(people, logger.makeChild('part1'));
  if (part === 2) part2(people, logger.makeChild('part2'));
  if (part === 3) part3(people, logger.makeChild('part3'));
}

main();
