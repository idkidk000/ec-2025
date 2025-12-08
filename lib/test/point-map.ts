import { HashedMap } from '@/hashed-map.0.ts';
import { HashedSet } from '@/hashed-set.0.ts';
import { Logger } from '@/logger.0.ts';
import { PackedMap } from '@/packed-map.0.ts';
import { PackedSet } from '@/packed-set.0.ts';
import { Point2D } from '@/point2d.0.ts';
import { Utils } from '@/utils.0.ts';

const logger = new Logger(import.meta.url);
const results: Record<'packedSet' | 'hashedSet' | 'packedMap' | 'hashedMap', { write: number[]; read: number[] }> = {
  packedSet: { read: [], write: [] },
  hashedSet: { read: [], write: [] },
  packedMap: { read: [], write: [] },
  hashedMap: { read: [], write: [] },
};

for (let run = 0; run < 10; ++run) {
  const points = Array.from({ length: 1_000_000 }, () => new Point2D(Math.random() * 10_000, Math.random() * 10_000));
  const pointsPair: [Point2D, number][] = points.map((point, i) => [point, i]);

  // PackedSet
  const packedSetWriteStarted = performance.now();
  const packedSet = new PackedSet(Point2D.pack, Point2D.unpack, points);
  const packedSetWriteTime = performance.now() - packedSetWriteStarted;
  results.packedSet.write.push(packedSetWriteTime);

  const packedSetReadStarted = performance.now();
  const _unpackedSet = packedSet.keys().toArray();
  const packedSetReadTime = performance.now() - packedSetReadStarted;
  results.packedSet.read.push(packedSetReadTime);

  logger.info({ run }, 'PackedSet', { packedSetWriteTime, packedSetReadTime });

  // HashedSet
  const hashedSetWriteStarted = performance.now();
  const hashedSet = new HashedSet(Point2D.pack, points);
  const hashedSetWriteTime = performance.now() - hashedSetWriteStarted;
  results.hashedSet.write.push(hashedSetWriteTime);

  const hashedSetReadStarted = performance.now();
  const _unhashedSet = hashedSet.keys().toArray();
  const hashedSetReadTime = performance.now() - hashedSetReadStarted;
  results.hashedSet.read.push(hashedSetReadTime);

  logger.info({ run }, 'HashedSet', { hashedSetWriteTime, hashedSetReadTime });

  // PackedMap
  const packedMapWriteStarted = performance.now();
  const packedMap = new PackedMap(Point2D.pack, Point2D.unpack, pointsPair);
  const packedMapWriteTime = performance.now() - packedMapWriteStarted;
  results.packedMap.write.push(packedMapWriteTime);

  const packedMapReadStarted = performance.now();
  const _unpackedMap = packedMap.entries().toArray();
  const packedMapReadTime = performance.now() - packedMapReadStarted;
  results.packedMap.read.push(packedMapReadTime);

  logger.info({ run }, 'PackedMap', { packedMapWriteTime, packedMapReadTime });

  // HashedMap
  const hashedMapWriteStarted = performance.now();
  const hashedMap = new HashedMap(Point2D.pack, pointsPair);
  const hashedMapWriteTime = performance.now() - hashedMapWriteStarted;
  results.hashedMap.write.push(hashedMapWriteTime);

  const hashedMapReadStarted = performance.now();
  const _unhashedMap = hashedMap.entries().toArray();
  const hashedMapReadTime = performance.now() - hashedMapReadStarted;
  results.hashedMap.read.push(hashedMapReadTime);

  logger.info({ run }, 'HashedMap', { hashedMapWriteTime, hashedMapReadTime });
}

Object.entries(results).forEach(([key, data]) => {
  logger.success(key);
  for (const test of ['write', 'read'] as const) {
    const times = data[test];
    const [min, max] = Utils.minMax(...times).map(Utils.roundTo);
    const avg = Utils.roundTo(Utils.mean(...times));
    logger.info(test, { min, max, avg });
  }
});
