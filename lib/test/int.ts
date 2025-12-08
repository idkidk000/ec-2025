const tests = ['isSafeInt', 'isInt', 'abs', 'lt', 'all'] as const;
const length = 10_000_000;
const input = Array.from({ length }, () => {
  const value = (Math.random() - 0.5) * 2 * (Math.random() > 0.5 ? Number.MAX_SAFE_INTEGER : 10_000);
  return Math.random() > 0.5 ? Math.round(value) : value;
});
for (const test of tests) {
  const output = new Array(input.length);
  let i = 0;

  await new Promise((resolve) => setTimeout(resolve, 100));

  const started = performance.now();
  if (test === 'abs') { for (const item of input) output[i++] = Math.abs(item); }
  else if (test === 'lt') { for (const item of input) output[i++] = item < 10_000; }
  else if (test === 'isInt') { for (const item of input) output[i++] = Number.isInteger(item); }
  else if (test === 'isSafeInt') { for (const item of input) output[i++] = Number.isSafeInteger(item); }
  else if (test === 'all') { for (const item of input) output[i++] = Number.isInteger(item) && Math.abs(item) < 10_000; }
  const time = performance.now() - started;

  // deno-lint-ignore no-console
  console.log(test, time);
}
