import { AocArgParser, EcArgParser } from '../../args.1.ts';
import { Logger } from '../../logger.0.ts';

function part1(_data: string, _logger: Logger) {
}

function part2(_data: string, _logger: Logger) {
}

function part3(_data: string, _logger: Logger) {
}

function mainAoc() {
  const { data, logger, part, ...rest } = new AocArgParser(import.meta.url);
  logger.debugHigh('aoc', { data, part, rest });
  logger.info('aoc', { data, part, rest });
  if (part !== 2) part1(data, logger.makeChild('part1'));
  if (part !== 1) part2(data, logger.makeChild('part2'));
}

function mainEc() {
  const { data, logger, part, ...rest } = new EcArgParser(import.meta.url);
  logger.debugHigh('ec', { data, part, rest });
  logger.info('ec', { data, part, rest });
  if (part === 1) part1(data, logger.makeChild('part1'));
  if (part === 2) part2(data, logger.makeChild('part2'));
  if (part === 3) part3(data, logger.makeChild('part3'));
}

mainAoc();
mainEc();
