import { Logger } from '@/logger.0.ts';

const logger = new Logger(import.meta.url);
const target = 10_050;

/** imagine that this was more complex */
function query(value: number) {
  return value ** 2;
}

// starting upper might be array.length-1 but in this case it's arbitrary
let upper = 10_000 - 1;
let lower = 0;
let i = 0;
while (lower !== upper) {
  const mid = lower + Math.ceil((upper - lower) / 2);
  const res = query(mid);
  if (res === target) {
    logger.success('found', { i, lower, upper, mid, res });
    break;
  }
  logger.debugLow('search', { i, lower, upper, mid, res });
  if (res > target) upper = mid - 1;
  else lower = mid;
  ++i;
}
logger.info('best', { i, lower, upper });
