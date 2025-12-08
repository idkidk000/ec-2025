/*
import { HashedSet } from '@/lib/hashed-set.0.ts';
import { Logger } from '@/lib/logger.0.ts';
import { Point2D } from '@/lib/point2.0.ts';
import { MathsUtils } from '@/lib/maths-utils.0.ts';

const makePoints = () =>
  Array.from({ length: 1_000_000 }, () =>
    new Point2D(
      Math.round((Math.random() * 1_000_000) - 500_000),
      Math.round((Math.random() * 1_000_000) - 500_000),
    ));

const logger = new Logger(import.meta.url);
const results: Record<'disjoint' | 'superset', { times: Record<'main' | 'filter', number[]>; fail: boolean }> = {
  disjoint: { times: { filter: [], main: [] }, fail: false },
  superset: { times: { filter: [], main: [] }, fail: false },
};
for (let run = 0; run < 10; ++run) {
  const left = new HashedSet(Point2D.fastPack, makePoints());
  const right = new HashedSet(Point2D.fastPack, makePoints());

  const disjointMainStart = performance.now();
  const disjointMain = left.isDisjointFrom(right);
  const disjointMainTime = performance.now() - disjointMainStart;
  results.disjoint.times.main.push(disjointMainTime);

  const disjointFilterStart = performance.now();
  const disjointFilter = left.isDisjointFromFilter(right);
  const disjointFilterTime = performance.now() - disjointFilterStart;
  results.disjoint.times.filter.push(disjointFilterTime);

  results.disjoint.fail ||= disjointMain !== disjointFilter;
  logger[disjointMain === disjointFilter ? 'success' : 'error']('disjoint', { disjointMainTime, disjointFilterTime });

  const supersetMainStart = performance.now();
  const supersetMain = left.isSupersetOf(right);
  const supersetMainTime = performance.now() - supersetMainStart;
  results.superset.times.main.push(supersetMainTime);

  const supersetFilterStart = performance.now();
  const supersetFilter = left.isSupersetOfFilter(right);
  const supersetFilterTime = performance.now() - supersetFilterStart;
  results.superset.times.filter.push(supersetFilterTime);

  results.superset.fail ||= supersetMain !== supersetFilter;
  logger[supersetMain === supersetFilter ? 'success' : 'error']('superset', { supersetMainTime, supersetFilterTime });
}

Object.entries(results).forEach(([method, data]) => {
  logger[data.fail ? 'error' : 'success']({ method, fail: data.fail });
  Object.entries(data.times).forEach(([test, times]) => {
    const [min, max] = MathsUtils.minMax(...times).map(MathsUtils.roundTo);
    const avg = MathsUtils.roundTo(MathsUtils.avg(...times));
    logger.info({ test, min, max, avg });
  });
});
 */
