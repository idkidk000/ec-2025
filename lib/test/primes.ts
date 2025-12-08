for (let i = 3; i < 100; ++i) {
  let pass = true;
  for (let j = 2; j < i; ++j) {
    if (Number.isInteger(i / j)) {
      pass = false;
      break;
    }
  }
  // deno-lint-ignore no-console
  if (pass) console.log(i);
}

/* for (let b = 0; b < 32; ++b) {
  const min = 1 << (b - 1);
  const max = (1 << b) - 1;
  for (let i = max; i >= min; --i) {
    let pass = true;
    for (let j = 2; j < i; ++j) {
      if (Number.isInteger(i / j)) {
        pass = false;
        break;
      }
    }
    if (pass) {
      // deno-lint-ignore no-console
      console.log({ b, min, max, i });
      break;
    }
  }
} */
