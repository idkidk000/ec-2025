import { parseArgs } from '@/lib/args.0.ts';
import { Logger } from '@/lib/logger.0.ts';
import { Utils } from '@/lib/utils.0.ts';

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
  ix: number;
  level: Level;
  profession: Profession;
}

function countPairs(people: Person[], logger: Logger): number {
  const novices = people.filter(({ level }) => level === Level.Novice);
  const mentors = people.filter(({ level }) => level === Level.Mentor);
  let total = 0;
  for (const novice of novices) {
    const count = mentors.filter((mentor) => novice.profession === mentor.profession && novice.ix > mentor.ix).length;
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
  const range = 1000;
  const repeats = 1000;
  let total = 0;
  for (const novice of people.filter(({ level }) => level === Level.Novice)) {
    logger.debugLow(novice);
    for (let rangeIx = -range; rangeIx <= range; ++rangeIx) {
      const mentorIx = novice.ix + rangeIx;
      const wrappedMentorIx = Utils.modP(mentorIx, people.length);
      const mentor = people[wrappedMentorIx];
      if (mentor.level !== Level.Mentor || mentor.profession !== novice.profession) continue;
      const firstRepeat = mentorIx < 0 ? 0 - Math.floor(mentorIx / people.length) : 0;
      const lastRepeat = repeats - 1 - (mentorIx >= people.length ? Math.floor(mentorIx / people.length) : 0);
      const repeatCount = lastRepeat - firstRepeat + 1;
      logger.debugMed({ mentorIx, wrappedMentorIx, firstRepeat, lastRepeat, len: people.length });
      total += repeatCount;
    }
  }
  // sample3, range=1000, repeats=1000 should give 3442321
  // 1667903460
  logger.success('total', total);
}

function main() {
  const { data, logger, part } = parseArgs(import.meta.url);
  const people = data.split('').map((token, ix) => {
    const upper = token.toUpperCase();
    return {
      ix,
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
