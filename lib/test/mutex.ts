import { Logger } from '@/logger.0.ts';
import { Mutex, Semaphore } from '@/mutex.0.ts';

const logger = new Logger(import.meta.url);
const mutex = new Mutex();
const semaphore = new Semaphore(0);

await Promise.all(
  Array.from({ length: 10 }, (_, i) => i).sort(() => Math.random() - 0.5).map(async (i) => {
    await semaphore.update((prev) => prev + 1);
    logger.debugLow(i, 'waiting');
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 10));
    logger.debugLow(i, 'acquiring');
    const release = await mutex.acquire();
    logger.debugLow(i, 'acquired');
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 100));
    logger.debugLow(i, 'releasing');
    release();
    try {
      release();
      throw new Error(`${i} was able to release a second time`);
      // deno-lint-ignore no-empty
    } catch {}
    logger.debugLow(i, 'done');
  }),
);
logger.success('all done', semaphore.value);
