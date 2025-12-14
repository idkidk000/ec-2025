import { EcArgParser } from '@/lib/args.1.ts';
import { Counter } from '@/lib/counter.1.ts';
import { Logger } from '@/lib/logger.0.ts';

enum Direction {
  In,
  Out,
}
interface Branch {
  thickness: number;
  node: number | null;
  direction: Direction;
}
interface Plant {
  thickness: number;
  branches: Branch[];
}

function simulate(plants: Map<number, Plant>, startingIds: number[], logger: Logger): number {
  let energies = new Counter<number>(startingIds);
  let nextEnergies = new Counter<number>();
  logger.debugMed('starting', energies);

  // push forward until no further nodes to transmit to
  while (true) {
    for (const [id, energy] of energies.entries()) {
      const plant = plants.get(id);
      if (!plant) throw new Error('oh no');
      if (energy >= plant.thickness) {
        for (const branch of plant.branches)
          if (branch.node !== null && branch.direction === Direction.Out) nextEnergies.add(branch.node, energy * branch.thickness);
      }
    }
    logger.debugMed({ energies, nextEnergies });
    if (!nextEnergies.values().some((energy) => energy)) break;
    [energies, nextEnergies] = [nextEnergies, energies];
    nextEnergies.clear();
  }
  const final = energies.entries().filter(([, energy]) => energy).toArray();
  if (final.length !== 1) {
    logger.error(energies);
    throw new Error('oh no');
  }
  const [[id, energy]] = final;
  const result = energy >= (plants.get(id)?.thickness ?? 0) ? energy : 0;
  return result;
}

function part1(plants: Map<number, Plant>, logger: Logger) {
  const startingIds: number[] = [];
  for (const [id, plant] of plants.entries()) {
    for (const branch of plant.branches)
      if (branch.node === null) startingIds.push(id);
  }

  const result = simulate(plants, startingIds, logger);
  // 2337532
  logger.success(result);
}

function part2(plants: Map<number, Plant>, tests: boolean[][], logger: Logger) {
  const results: number[] = [];
  for (const test of tests) {
    let index = 0;
    const startingIds: number[] = [];
    for (const [id, plant] of plants.entries()) {
      for (const branch of plant.branches)
        if (branch.node === null && test[index++]) startingIds.push(id);
    }
    const result = simulate(plants, startingIds, logger);
    logger.debugLow({ test, startingIds, result });
    results.push(result);
  }

  const result = results.reduce((acc, item) => acc + item, 0);
  // 14053384823
  logger.success(result);
}

function part3(plants: Map<number, Plant>, tests: boolean[][], logger: Logger) {
  /* 4 layers:
   * - 81x input
   * - 9x  layer 1a which mix 9x inputs in order (i.e. 1 uses inputs 1-9, 2 uses inputs 10-18)
   * - 9x  layer 1b which mix 9x inputs in steps of 9 and each is incremented by 1 (i.e. 1 uses 1,10,19,28,... 2 uses 2,11,20,29,...)
   * - 9x  layer 2  which mix 1x layer 1a and 1x layer 1b
   * - 1x  output which mixes layer 2. weights are positive
   *
   * each node of l1a, l1b, l2 uses unique inputs - none are reused
   *
   * l1 has a mix of positive and negative weights
   * l2 has only positive
   * output has only positive
   *
   * each l1 node has at most 512 values
   * each l2 node has at most 262144 values
   *
   * the connections to a given input are either all + or all -
   * so the ideal test case is just + = on, - = off
   * (also all the inputs start from 1 so the searches in p2 were unnecessary)
   */
  enum NodeType {
    Input,
    Level1,
    Level2,
    Output,
  }
  const nodeTypes = new Map<number, NodeType>();
  for (const [id, plant] of plants.entries()) {
    const nodeType: NodeType = plant.branches.every((branch) => branch.direction === Direction.In)
      ? NodeType.Output
      : plant.branches.some((branch) => branch.node === null)
      ? NodeType.Input
      : plant.branches.every((branch) => branch.thickness > 0)
      ? NodeType.Level2
      : NodeType.Level1;
    nodeTypes.set(id, nodeType);
  }
  logger.info(nodeTypes);
  const nodeTypeCounts = nodeTypes.values().reduce<Partial<Record<NodeType, number>>>((acc, item) => {
    // deno-lint-ignore no-non-null-assertion
    if (item in acc) ++acc[item]!;
    else acc[item] = 1;
    return acc;
  }, {});
  logger.info(nodeTypeCounts);
  if (
    nodeTypeCounts[NodeType.Input] !== 81 || nodeTypeCounts[NodeType.Level1] !== 18 || nodeTypeCounts[NodeType.Level2] !== 9 ||
    nodeTypeCounts[NodeType.Output] !== 1
  ) {
    throw new Error('oh no');
  }
  const inputThicknessCounts = new Counter<'+' | '-' | 'oh no'>();
  // deno-lint-ignore no-non-null-assertion
  for (const input of nodeTypes.entries().filter(([, nodeType]) => nodeType === NodeType.Input).map(([id]) => plants.get(id)!)) {
    const connections = input.branches.filter((branch) => branch.node !== null);
    if (connections.every((branch) => branch.thickness > 0)) inputThicknessCounts.add('+');
    else if (connections.every((conn) => conn.thickness < 0)) inputThicknessCounts.add('-');
    else {
      logger.error('oh no', connections);
      inputThicknessCounts.add('oh no');
    }
  }
  logger.info(inputThicknessCounts);
  if (inputThicknessCounts.get('oh no') ?? 0) throw new Error('oh no');
  const idealStartingIds: number[] = [];
  for (const [id, plant] of plants.entries().filter(([id]) => nodeTypes.get(id) === NodeType.Input)) {
    const connections = plant.branches.filter((branch) => branch.node !== null && branch.direction === Direction.Out);
    if (connections.some((branch) => branch.thickness > 0) && connections.some((branch) => branch.thickness < 0)) logger.error('oh no', connections);
    if (connections.every((branch) => branch.thickness > 0)) idealStartingIds.push(id);
  }
  const maximumResult = simulate(plants, idealStartingIds, logger);
  logger.info(idealStartingIds, idealStartingIds.length, maximumResult);

  const testResults: number[] = [];
  for (const test of tests) {
    const startingIds = test.map((item, i) => ({ item, id: i + 1 })).filter(({ item }) => item).map(({ id }) => id);
    testResults.push(simulate(plants, startingIds, logger));
  }

  const result = testResults.filter((item) => item > 0).map((item) => maximumResult - item).reduce((acc, item) => acc + item, 0);

  // 134790
  logger.success(result);
}

function main() {
  const { data, logger, part } = new EcArgParser(import.meta.url);
  const plants = new Map<number, Plant>();
  for (const plantData of data.matchAll(/^Plant (?<id>\d+) with thickness (?<thickness>-?\d+):(?<branches>(?:\n- [^\n]+)+)/gm)) {
    if (!plantData.groups) throw new Error('oh no');
    const id = parseInt(plantData.groups.id);
    const plant: Plant = {
      thickness: parseInt(plantData.groups.thickness),
      branches: [],
    };
    for (const branchData of plantData.groups.branches.matchAll(/^- (?:free branch|branch to Plant )(?<id>\d+)? with thickness (?<thickness>-?\d+)$/gm)) {
      if (!branchData.groups) throw new Error('oh no');
      plant.branches.push({
        thickness: parseInt(branchData.groups.thickness),
        node: typeof branchData.groups.id === 'undefined' ? null : parseInt(branchData.groups.id),
        direction: Direction.In,
      });
    }
    plants.set(id, plant);
  }
  // add reverse connections
  for (const [id, plant] of plants.entries()) {
    for (const branch of plant.branches) {
      if (branch.node !== null && branch.direction === Direction.In)
        plants.get(branch.node)?.branches.push({ node: id, thickness: branch.thickness, direction: Direction.Out });
    }
  }
  const tests = data
    .matchAll(/^(?<case>[10 ]+)$/gm)
    .filter((match): match is typeof match & { groups: { [key: string]: string } } => typeof match.groups !== 'undefined')
    .map((match) => match.groups.case.split(/\s+/).map((token) => Boolean(parseInt(token))))
    .toArray();
  logger.debugHigh({ plants, tests });
  if (part === 1) part1(plants, logger.makeChild('part1'));
  if (part === 2) part2(plants, tests, logger.makeChild('part2'));
  if (part === 3) part3(plants, tests, logger.makeChild('part3'));
}

main();
