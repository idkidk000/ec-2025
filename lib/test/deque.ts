import { ansiStyles, Logger } from '@/logger.0.ts';
import { Utils } from '@/utils.0.ts';
import { Deque, DequeArrayLike, DequeArrayLike2 } from '@/deque.0.ts';

const logger = new Logger(import.meta.url);
const [runs, length] = Deno.args.includes('-vfast') ? [1, 10] : Deno.args.includes('-fast') ? [10, 100_000] : [10, 1_000_000];

const classes = [
  Deque,
  DequeArrayLike,
  DequeArrayLike2,
] as const;
const tests = ['backBack', 'backFront', 'frontBack', 'frontFront'] as const;
type ClassName = (typeof classes)[number]['name'];
type Test = (typeof tests)[number];

const results = new Map<ClassName, Map<Test, { push: number; pop: number; iter: number; iterPass: boolean; popPass: boolean }[]>>();

for (const constructor of classes) {
  results.set(constructor.name, new Map());
  for (const test of tests) {
    results.get(constructor.name)?.set(test, []);
    for (let run = 0; run < runs; ++run) {
      const input = Array.from({ length }, (_, i) => i);
      // the shapes don't match so just assert that we're contructing a Deque
      const deque = new (constructor<number> as typeof Deque<number>)();
      const pushStarted = performance.now();
      if (test === 'backBack' || test === 'backFront') { for (const item of input) deque.pushBack(item); }
      else if (test === 'frontBack' || test === 'frontFront') { for (const item of input) deque.pushFront(item); }
      const pushTime = performance.now() - pushStarted;

      let iterOutput: number[];
      const iterStarted = performance.now();
      if (test === 'backBack' || test === 'frontBack') iterOutput = deque.itemsBack().toArray();
      else if (test === 'backFront' || test === 'frontFront') iterOutput = deque.itemsFront().toArray();
      else iterOutput = [];
      const iterTime = performance.now() - iterStarted;

      const iterPass = iterOutput.length === input.length && (
        test === 'backBack' || test === 'frontFront'
          ? iterOutput.toReversed().every((item, i) => input[i] === item)
          : test === 'backFront' || test === 'frontBack'
          ? iterOutput.every((item, i) => input[i] === item)
          : false
      );

      const popOutput: number[] = [];
      const popStarted = performance.now();
      // deno-lint-ignore no-non-null-assertion
      if (test === 'backBack' || test === 'frontBack') { while (deque.size) popOutput.push(deque.popBack()!); }
      // deno-lint-ignore no-non-null-assertion
      else if (test === 'backFront' || test === 'frontFront') { while (deque.size) popOutput.push(deque.popFront()!); }
      const popTime = performance.now() - popStarted;

      const popPass = popOutput.length === input.length && (
        test === 'backBack' || test === 'frontFront'
          ? popOutput.toReversed().every((item, i) => input[i] === item)
          : test === 'backFront' || test === 'frontBack'
          ? popOutput.every((item, i) => input[i] === item)
          : false
      );

      logger.info(constructor.name, test, run, {
        push: Utils.roundTo(pushTime),
        iter: Utils.roundTo(iterTime),
        pop: Utils.roundTo(popTime),
        iterPass,
      });
      results.get(constructor.name)?.get(test)?.push({ iter: iterTime, iterPass, pop: popTime, popPass, push: pushTime });

      if (Deno.args.includes('-vfast')) {
        if (!(iterPass && popPass)) logger.info('input', input);
        if (!iterPass) logger.info('iterOutput', iterOutput);
        if (!popPass) logger.info('popOutput', popOutput);
      }
    }
  }
}

for (const [className, data] of results.entries()) {
  for (const [test, testData] of data.entries()) {
    const lengthPass = testData.length > 0;
    const iterPass = testData.every(({ iterPass }) => iterPass);
    const popPass = testData.every(({ popPass }) => popPass);

    const pass = lengthPass && iterPass && popPass;
    logger.info(
      `${ansiStyles.bold}${className} ${test} ${pass ? `${ansiStyles.fgIntense.green}PASS` : `${ansiStyles.fgIntense.red}FAIL`}${ansiStyles.reset}`,
      ...[['length', lengthPass], ['iter', iterPass], ['pop', popPass]].map(([label, value]) =>
        `${value ? ansiStyles.fg.green : ansiStyles.fg.red}${label}${ansiStyles.reset}`
      ),
    );
    for (const operation of ['push', 'iter', 'pop'] as const) {
      const times = testData.map((item) => item[operation]);
      const [min, max] = Utils.minMax(...times).map(Utils.roundTo);
      const avg = Utils.roundTo(Utils.mean(...times));
      logger.info(`  ${operation}`, { min, max, avg });
    }
  }
}
