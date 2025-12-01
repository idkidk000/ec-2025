import { inspect } from 'node:util';

// length < this will use #array.toSorted; >= will use a new BinaryHeap() and copy #array over
const ITERATOR_COPY_THRESHOLD = 50_000;
/**
 * root (array[0]) is the next item according to comparator
 *
 * each parent has two children. the children's value values sort equally or lower than the parent's according to comparator
 *
 * on push, the new item is placed at the end of the array (leaf) and is swapped toward the root until comparator is satisfied. the tree is now sorted.
 *
 * on pop, the root (array[0]) is returned. the last array item (leaf) is then moved to the root and recursively tested against each child and swapped until comparator is satisfied. the tree is now sorted.
 *
 * a sorted tree guarantees that the root (array[0]) is the next item, and that each item's children rank <= according to comparator. but last (array.at(-1)!) is not necessarily the last item according to comparator and there are no shortcuts for getting the nth item from the root - the root must be replaced with the last and that must be recursively swapped towards the correct position on each pop
 *
 * array indices:
 * ```
 * 7 8
 *  3   4   5   6
 *    1       2
 *       0
 * ```
 * array values
 * ```
 * 4 3
 *  1   0   1   1
 *    0       1
 *        0
 * ```
 * https://www.youtube.com/watch?v=AE5I0xACpZs
 */
export class BinaryHeap<Item> {
  #array: Item[] = [];
  constructor(public readonly comparator: (a: Item, b: Item) => number, iterable?: Iterable<Item>) {
    if (iterable) { for (const item of iterable) this.push(item); }
  }
  get length() {
    return this.#array.length;
  }
  push(...values: Item[]) {
    for (const value of values) {
      this.#array.push(value);
      let itemIx = this.#array.length - 1;
      while (itemIx > 0) {
        // parent index can always be calculated like this since the tree is filled from the root and there can only be gaps at the leaves
        const parentIx = (itemIx - 1) >> 1;
        if (this.comparator(this.#array[itemIx], this.#array[parentIx]) >= 0) break;
        // keep swapping child and parent until the branch is sorted
        [this.#array[itemIx], this.#array[parentIx]] = [this.#array[parentIx], this.#array[itemIx]];
        itemIx = parentIx;
      }
    }
    return this;
  }
  pop(): Item | undefined {
    if (this.#array.length === 0) return;
    // root is the first item according to `comparator`
    const root = this.#array[0];
    // deno-lint-ignore no-non-null-assertion
    const last = this.#array.pop()!;
    // `root` and `last` are the same item if the array is now empty
    if (this.#array.length === 0) return root;
    // last item has to be placed at root, then needs to be swapped towards the correct place in the tree
    this.#array[0] = last;
    let parentIx = 0;
    while (true) {
      let itemIx = parentIx;
      const [childAIx, childBIx] = [parentIx * 2 + 1, parentIx * 2 + 2];
      if (childAIx < this.#array.length && this.comparator(this.#array[childAIx], this.#array[itemIx]) < 0) itemIx = childAIx;
      if (childBIx < this.#array.length && this.comparator(this.#array[childBIx], this.#array[itemIx]) < 0) itemIx = childBIx;
      if (itemIx === parentIx) break;
      // keep swapping parent and child until the branch is sorted
      [this.#array[parentIx], this.#array[itemIx]] = [this.#array[itemIx], this.#array[parentIx]];
      parentIx = itemIx;
    }
    return root;
  }
  // these all execute in array rather than comparator order and are missing the `index` and `array` callback args
  includes(value: Item): boolean {
    return this.#array.includes(value);
  }
  some(callback: (value: Item) => boolean): boolean {
    return this.#array.some(callback);
  }
  every(callback: (value: Item) => boolean): boolean {
    // `Array.prototype.every` is slower
    for (const item of this.#array) if (!callback(item)) return false;
    return true;
  }
  reduce(callback: (previousValue: Item, currentValue: Item) => Item): Item;
  reduce<Reduced>(callback: (previousValue: Reduced, currentValue: Item) => Reduced, initialValue: Reduced): Reduced;
  reduce<Reduced = Item>(callback: (previousValue: Reduced | Item, currentValue: Item) => Reduced | Item, initialValue?: Reduced) {
    return typeof initialValue === 'undefined'
      ? this.#array.reduce(callback as (previousValue: Item, currentValue: Item) => Item)
      : this.#array.reduce<Reduced>(callback as (previousValue: Reduced, currentValue: Item) => Reduced, initialValue);
  }
  clear(): void {
    this.#array = [];
  }
  peek(): Item | undefined {
    return this.#array.at(0);
  }
  clone(): BinaryHeap<Item> {
    const heap = new BinaryHeap<Item>(this.comparator);
    heap.#array = [...this.#array];
    return heap;
  }
  /** **Destructive** convenience method. `while (instance.length) instance.pop()` is faster */
  *popAll(): Generator<Item, void, void> {
    // deno-lint-ignore no-non-null-assertion
    while (this.#array.length) yield this.pop()!;
  }
  /** **Non-destructive** - iterates over a copy */
  *items(): Generator<Item, void, void> {
    // `toSorted` is faster on smaller arrays. creating a new heap is faster on larger
    if (this.#array.length < ITERATOR_COPY_THRESHOLD) { for (const item of this.#array.toSorted(this.comparator)) yield item; }
    else {
      const heap = new BinaryHeap(this.comparator);
      heap.#array = [...this.#array];
      // deno-lint-ignore no-non-null-assertion
      while (heap.length) yield heap.pop()!;
    }
  }
  /** **Non-destructive** - iterates over a copy */
  *entries(): Generator<[number, Item], void, void> {
    if (this.#array.length < ITERATOR_COPY_THRESHOLD) { for (const [i, item] of this.#array.toSorted(this.comparator).entries()) yield [i, item]; }
    else {
      const heap = new BinaryHeap(this.comparator);
      heap.#array = [...this.#array];
      let i = 0;
      // deno-lint-ignore no-non-null-assertion
      while (heap.length) yield [i++, heap.pop()!];
    }
  }
  [inspect.custom]() {
    return this.items().toArray();
  }
  [Symbol.iterator]() {
    return this.items();
  }
}
