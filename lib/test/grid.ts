import { CoordSystem, Grid } from '@/grid.0.ts';
import { ansiStyles, Logger } from '@/logger.0.ts';
import { Utils } from '@/utils.0.ts';

const logger = new Logger(import.meta.url);
const systems = ['rc', 'xy'] as const;
type System = (typeof systems)[number];

const measureTimes = ['construct', 'cellIter', 'rowIter', 'colIter'] as const;
type Time = (typeof measureTimes)[number];

const tests = ['entries', 'coord', 'set', 'find'] as const;
type Test = (typeof tests)[number];

const results: Record<System, {
  pass: Record<Test, boolean>;
  time: Record<Time, number>;
}[]> = {
  rc: [],
  xy: [],
};
const [size, runs] = Deno.args.includes('-vfast') ? [10, 1] : Deno.args.includes('-fast') ? [1_000, 10] : [10_000, 10];
for (let run = 0; run < runs; ++run) {
  for (const system of ['rc', 'xy'] as const) {
    const constructStart = performance.now();
    const grid = new Grid(
      { rows: Math.max(1, Math.round(Math.random() * size)), cols: Math.max(1, Math.round(Math.random() * size)), fill: ({ i }) => i },
      system === 'rc' ? CoordSystem.Rc : CoordSystem.Xy,
    );
    const constructTime = performance.now() - constructStart;

    const entriesPass = grid.cellEntries().every(([{ i }, cell]) => cell === i);
    const coordPass = grid.cellEntries().every(([coord]) =>
      (system === 'rc' ? grid.coordToIndex(coord.r, coord.c) : grid.coordToIndex(coord.x, coord.y)) === coord.i
    );

    let setPass = true;
    for (let c = 0; c < grid.cols; ++c) {
      for (let r = 0; r < grid.rows; ++r) {
        const [a, b] = system === 'rc' ? [r, c] : [c, r];
        const i = grid.coordToIndex(a, b);
        const prev = grid.cellAt(a, b);
        const next = grid.cellSet(a, b, 1);
        if (prev !== i || next !== 1) setPass = false;
        // logger.debugLow({ i, x, y, prev, next });
      }
    }

    let findPass = true;
    for (let i = 0; i < size; ++i) {
      const index = Math.round(Math.random() * (grid.length - 1));
      const prev = grid.cellAt(index);
      grid.cellSet(index, Infinity);
      const findIndex = grid.find((value) => value === Infinity)?.i;
      const findLastIndex = grid.findLast((value) => value === Infinity)?.i;
      // deno-lint-ignore no-non-null-assertion
      grid.cellSet(index, prev!);
      if (index !== findIndex || index !== findLastIndex) findPass = false;
    }

    const cellIterStart = performance.now();
    grid.cellItems().toArray();
    const cellIterTime = performance.now() - cellIterStart;

    const rowIterStart = performance.now();
    grid.rowItems().toArray();
    const rowIterTime = performance.now() - rowIterStart;

    const colIterStart = performance.now();
    grid.colItems().toArray();
    const colIterTime = performance.now() - colIterStart;

    logger.debugLow({ run, size, system, entriesPass, coordPass, setPass, cellIterTime, rowIterTime, colIterTime });

    results[system].push({
      pass: { coord: coordPass, entries: entriesPass, set: setPass, find: findPass },
      time: { cellIter: cellIterTime, colIter: colIterTime, rowIter: rowIterTime, construct: constructTime },
    });
  }
}

for (const [key, data] of Object.entries(results)) {
  const testResults = new Map(tests.map((test) => [test, data.every(({ pass }) => pass[test])] satisfies [Test, boolean]));
  const pass = data.length && testResults.values().every((value) => value);
  logger.info(
    `${ansiStyles.bold}${key} ${pass ? ansiStyles.fgIntense.green : ansiStyles.fgIntense.red}${pass ? 'PASS' : 'FAIL'}${ansiStyles.reset}`,
    ...testResults.entries().map(([test, result]) => `${result ? ansiStyles.fg.green : ansiStyles.fg.red}${test}${ansiStyles.reset}`),
    { size, runs },
  );
  for (const time of measureTimes) {
    const times = data.map((item) => item.time[time]);
    const [min, max] = Utils.minMax(...times).map(Utils.roundTo);
    const avg = Utils.roundTo(Utils.mean(...times));
    logger.info(`  ${time}`, { min, max, avg });
  }
}

const grid = new Grid({ cols: 5, rows: 5, fill: ({ r, c }) => (r + c) % 10 }, CoordSystem.Rc, (v) => {
  switch (Math.round(Math.random() * 5)) {
    case 0:
      return `${ansiStyles.bold}${ansiStyles.fgIntense.blue}${v}${ansiStyles.reset}`;
    case 1:
      return `${ansiStyles.bold}${ansiStyles.fgIntense.cyan}${v}${ansiStyles.reset}`;
    case 2:
      return `${ansiStyles.bold}${ansiStyles.fgIntense.green}${v}${ansiStyles.reset}`;
    case 3:
      return `${ansiStyles.bold}${ansiStyles.fgIntense.purple}${v}${ansiStyles.reset}`;
    case 4:
      return `${ansiStyles.bold}${ansiStyles.fgIntense.red}${v}${ansiStyles.reset}`;
    case 5:
      return `${ansiStyles.bold}${ansiStyles.fgIntense.yellow}${v}${ansiStyles.reset}`;
    default:
      throw new Error('no');
  }
});

logger.info(grid);
