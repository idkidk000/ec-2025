## Everybody Codes 2025

### Deps

This project uses `aoc-2025-deno-libs` as a submodule.\
Either:

- Add `--recurse-submodules` to your `git clone` command, e.g. `git clone --recurse-submodules [repo_url] [local_dir]`
- Or run `git submodule init` and `git submodule fetch`

### Usage

To run day 1 part 1 with log level set to Info:\
`deno run -R day/01/main.ts -p 1 -l 3`

Args are documented in `lib/args.[version].ts`\
Log levels are documented in `lib/logger.[version].ts`

To create day 1 from template and open in IDE\
`deno task init 1`

For day 1 part 3\
`deno task init 1 3`
