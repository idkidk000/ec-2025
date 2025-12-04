import { EcArgParser } from '@/lib/args.1.ts';
import { Logger } from '@/lib/logger.0.ts';

function part1(_data: string, _logger: Logger) {
}

function part2(_data: string, _logger: Logger) {
}

function part3(_data: string, _logger: Logger) {
}

function main() {
  const { data, logger, part } = new EcArgParser(import.meta.url);
  if (part === 1) part1(data, logger.makeChild('part1'));
  if (part === 2) part2(data, logger.makeChild('part2'));
  if (part === 3) part3(data, logger.makeChild('part3'));
}

main();
