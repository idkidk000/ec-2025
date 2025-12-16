## Everybody Codes 2025

### Requirements

This project uses [`deno`](https://deno.com/) and has my [`aoc-2025-deno-libs`](https://github.com/idkidk000/aoc-2025-deno-libs) project as a
[submodule](https://git-scm.com/book/en/v2/Git-Tools-Submodules). There are no other external dependencies.\
Either:

- Add `--recurse-submodules` to your `git clone` command, e.g. `git clone --recurse-submodules [repo_url] [local_dir]`
- Or run `git submodule init` and `git submodule update`

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
| [01 - Whispers in the Shell](day/01/main.ts)       | 0.049s | 0.049s | 0.047s  |
| [02 - From Complex to Clarity](day/02/main.ts)     | 0.051s | 0.129s | 2.702s  |
| [03 - The Deepest Fit](day/03/main.ts)             | 0.046s | 0.054s | 0.133s  |
| [04 - Teeth of the Wind](day/04/main.ts)           | 0.049s | 0.048s | 0.056s  |
| [05 - Fishbone Order](day/05/main.ts)              | 0.055s | 0.054s | 0.070s  |
| [06 - Mentorship Matrix](day/06/main.ts)           | 0.053s | 0.051s | 0.237s  |
| [07 - Namegraph](day/07/main.ts)                   | 0.055s | 0.046s | 4.439s  |
| [08 - The Art of Connection](day/08/main.ts)       | 0.047s | 0.118s | 0.997s  |
| [09 - Encoded in the Scales](day/09/main.ts)       | 0.050s | 0.096s | 2.731s  |
| [10 - Bloodmouth on the Board](day/10/main.ts)     | 0.051s | 0.124s | 1.504s  |
| [11 - The Scout Duck Protocol](day/11/main.ts)     | 0.048s | 0.968s | 0.048s  |
| [12 - One Spark to Burn Them All](day/12/main.ts)  | 0.056s | 0.078s | 13.409s |
| [13 - Unlocking the Mountain](day/13/main.ts)      | 0.048s | 0.053s | 0.051s  |
| [14 - The Game of Light](day/14/main.ts)           | 0.062s | 1.446s | 0.101s  |
| [15 - Definitely Not a Maze](day/15/main.ts)       | 0.059s | 0.486s | 3.118s  |
| [16 - Harmonics of Stone](day/16/main.ts)          | 0.046s | 0.051s | 0.059s  |
| [17 - Deadline-Driven Development](day/17/main.ts) | 0.055s | 0.117s | 24.949s |
| [18 - When Roots Remember](day/18/main.ts)         | 0.045s | 0.055s | 0.056s  |
| [19 - Flappy Quack](day/19/main.ts)                | 0.061s | 0.076s | 0.058s  |
| [20 - Dream in Triangles](day/20/main.ts)          | 0.048s | 0.064s | 0.071s  |
