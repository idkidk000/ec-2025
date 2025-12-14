## Everybody Codes 2025

### Requirements

This project uses [`deno`](https://deno.com/) and has [`aoc-2025-deno-libs`](https://github.com/idkidk000/aoc-2025-deno-libs) as a
[submodule](https://git-scm.com/book/en/v2/Git-Tools-Submodules). There are no other external dependencies.\
Either:

- Add `--recurse-submodules` to your `git clone` command, e.g. `git clone --recurse-submodules [repo_url] [local_dir]`
- Or run `git submodule init` and `git submodule fetch`

### Usage

To create day 1 from template and open in IDE:\
`deno task init 1`

For day 1 part 3:\
`deno task init 1 3`

To run day 1 part 2 with log level set to Debug:High (extremely verbose):\
`deno run -R day/01/main.ts -p 2 -l 0`

Args are documented in `lib/args.[version].ts`\
Log levels are documented in `lib/logger.[version].ts`

### Benchmarks

| Day                                                | Part 1 | Part 2 | Part 3  |
| -------------------------------------------------- | ------ | ------ | ------- |
| [01 - Whispers in the Shell](day/01/main.ts)       | 0.048s | 0.048s | 0.046s  |
| [02 - From Complex to Clarity](day/02/main.ts)     | 0.044s | 0.135s | 2.700s  |
| [03 - The Deepest Fit](day/03/main.ts)             | 0.045s | 0.046s | 0.127s  |
| [04 - Teeth of the Wind](day/04/main.ts)           | 0.045s | 0.045s | 0.050s  |
| [05 - Fishbone Order](day/05/main.ts)              | 0.046s | 0.055s | 0.064s  |
| [06 - Mentorship Matrix](day/06/main.ts)           | 0.046s | 0.048s | 0.242s  |
| [07 - Namegraph](day/07/main.ts)                   | 0.044s | 0.046s | 4.408s  |
| [08 - The Art of Connection](day/08/main.ts)       | 0.047s | 0.114s | 0.990s  |
| [09 - Encoded in the Scales](day/09/main.ts)       | 0.045s | 0.096s | 2.696s  |
| [10 - Bloodmouth on the Board](day/10/main.ts)     | 0.050s | 0.130s | 1.480s  |
| [11 - The Scout Duck Protocol](day/11/main.ts)     | 0.046s | 0.967s | 0.048s  |
| [12 - One Spark to Burn Them All](day/12/main.ts)  | 0.053s | 0.073s | 13.436s |
| [13 - Unlocking the Mountain](day/13/main.ts)      | 0.048s | 0.057s | 0.050s  |
| [14 - The Game of Light](day/14/main.ts)           | 0.068s | 1.487s | 0.096s  |
| [15 - Definitely Not a Maze](day/15/main.ts)       | 0.061s | 0.482s | 3.857s  |
| [16 - Harmonics of Stone](day/16/main.ts)          | 0.044s | 0.047s | 0.053s  |
| [17 - Deadline-Driven Development](day/17/main.ts) | 0.053s | 0.122s | 24.102s |
| [18 - When Roots Remember](day/18/main.ts)         | 0.046s | 0.060s | 0.059s  |
