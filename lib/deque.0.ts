import { EventEmitter } from 'node:events';
import { inspect } from 'node:util';

// write then increment for pushBack, decrement then read for popBack
// decrement then write for pushFront, read then increment for popFront
// i.e. this.#back = writeable ix, this.#front = readable ix

export interface DequeParams {
  growthFactor?: number | false;
  deleteStrategy?: DequeDelete;
}
export enum DequeDelete {
  None,
  Null,
  Full,
}

/** Circular array similar to `Array` and python's `Deque`*/
export class Deque<Item> {
  #array: Item[];
  #front = 0;
  #back = 0;
  #growthFactor: number | false;
  #deleteStrategy: DequeDelete;
  #startingLength: number;
  #size: number;
  // used by `DequeArrayLike2`
  protected emitter = new EventEmitter<{ grow: [from: number, to: number] }>();
  /** Default `deleteStrategy` is `Deque.Null`, which allows gc but avoids the performance hit of `Deque.Delete`
   *
   * Default `growthFactor` is `2`. Specify `growthFactor: false` for a sliding window */
  constructor(length?: number, params?: DequeParams);
  constructor(iterable: Iterable<Item>, params?: DequeParams);
  constructor(param: number | Iterable<Item> = 1024, { growthFactor = 2, deleteStrategy = DequeDelete.Null }: DequeParams = {}) {
    if (typeof growthFactor === 'number' && growthFactor <= 1) throw new Error('growthFactor must be false or >1');
    this.#growthFactor = growthFactor;
    this.#deleteStrategy = deleteStrategy;
    if (typeof param === 'number') {
      this.#array = new Array(Math.max(param, 1));
      this.#size = 0;
    } else {
      const items = [...param];
      this.#array = new Array(Math.ceil(Math.max(items.length * (this.#growthFactor ? this.#growthFactor : 1), 1)));
      // push back
      for (const item of items) this.#array[this.#back++] = item;
      this.#size = items.length;
    }
    this.#startingLength = this.#array.length;
  }
  #grow(): boolean {
    if (!this.#growthFactor) return false;
    // it's significantly faster to create a new array and copy everything over than to expand the existing array by writing beyond the last ix and moving everything from back ix to the new end
    const prevLength = this.#array.length;
    const array = new Array(Math.ceil(this.#array.length * this.#growthFactor));
    for (let destIx = 0; destIx < this.#array.length; ++destIx) {
      const intermediate = destIx + this.#back;
      array[destIx] = this.#array[intermediate < this.#array.length ? intermediate : intermediate - this.#array.length];
    }
    this.#front = 0;
    this.#back = this.#array.length;
    this.#array = array;
    this.emitter.emit('grow', prevLength, this.#array.length);
    return true;
  }
  pushBack(...values: Item[]) {
    for (const value of values) {
      this.#array[this.#back] = value;
      if (this.#back === this.#array.length - 1) this.#back = 0;
      else ++this.#back;
      if (this.#size < this.#array.length - 1 || (this.#growthFactor && this.#grow())) ++this.#size;
      // array is full and growth is disabled
      else if (this.#front === this.#array.length - 1) this.#front = 0;
      else ++this.#front;
    }
    return this.#size;
  }
  pushFront(...values: Item[]) {
    for (const value of values) {
      if (this.#front === 0) this.#front = this.#array.length - 1;
      else --this.#front;
      this.#array[this.#front] = value;
      if (this.#size < this.#array.length - 1 || (this.#growthFactor && this.#grow())) ++this.#size;
      // array is full and growth is disabled
      else if (this.#back === 0) this.#back = this.#array.length - 1;
      else --this.#back;
    }
    return this.#size;
  }
  popBack(): Item | undefined {
    if (this.#size === 0) return;
    if (this.#back === 0) this.#back = this.#array.length - 1;
    else --this.#back;
    const value = this.#array[this.#back];
    if (this.#deleteStrategy === DequeDelete.Full) delete this.#array[this.#back];
    else if (this.#deleteStrategy === DequeDelete.Null) this.#array[this.#back] = null as Item;
    --this.#size;
    return value;
  }
  popFront(): Item | undefined {
    if (this.#size === 0) return;
    const value = this.#array[this.#front];
    if (this.#deleteStrategy === DequeDelete.Full) delete this.#array[this.#front];
    else if (this.#deleteStrategy === DequeDelete.Null) this.#array[this.#front] = null as Item;
    if (this.#front === this.#array.length - 1) this.#front = 0;
    else ++this.#front;
    --this.#size;
    return value;
  }
  at(index: number): Item | undefined {
    if (index >= 0) {
      if (index >= this.#size) return;
      const intermediate = index + this.#front;
      return this.#array.at(intermediate < this.#array.length ? intermediate : intermediate - this.#array.length);
    }
    if (-index > this.#size) return;
    const intermediate = this.#back + index;
    return this.#array.at(intermediate >= 0 ? intermediate : intermediate + this.#array.length);
  }
  set(index: number, value: Item): Item {
    if (index >= 0) {
      // regular `Array` grows when assigning to an oob index but that would break things
      if (index >= this.#size) throw new Error('out of bounds');
      const intermediate = index + this.#front;
      return this.#array[intermediate < this.#array.length ? intermediate : intermediate - this.#array.length] = value;
    } else if (-index > this.#size) { throw new Error('out of bounds'); }
    const intermediate = this.#back + index;
    return this.#array[intermediate >= 0 ? intermediate : intermediate + this.#array.length] = value;
  }
  find(predicate: (value: Item, index: number, deque: this) => boolean): Item | undefined {
    for (let i = 0; i < this.#size; ++i) {
      const intermediate = i + this.#front;
      const value = this.#array[intermediate < this.#array.length ? intermediate : intermediate - this.#array.length];
      if (predicate(value, i, this)) return value;
    }
  }
  findIndex(predicate: (value: Item, index: number, deque: this) => boolean): number {
    for (let i = 0; i < this.#size; ++i) {
      const intermediate = i + this.#front;
      const value = this.#array[intermediate < this.#array.length ? intermediate : intermediate - this.#array.length];
      if (predicate(value, i, this)) return i;
    }
    return -1;
  }
  findLast(predicate: (value: Item, index: number, deque: this) => boolean): Item | undefined {
    for (let i = this.#size - 1; i >= 0; --i) {
      const intermediate = i + this.#front;
      const value = this.#array[intermediate < this.#array.length ? intermediate : intermediate - this.#array.length];
      if (predicate(value, i, this)) return value;
    }
  }
  findLastIndex(predicate: (value: Item, index: number, deque: this) => boolean): number {
    for (let i = this.#size - 1; i >= 0; --i) {
      const intermediate = i + this.#front;
      const value = this.#array[intermediate < this.#array.length ? intermediate : intermediate - this.#array.length];
      if (predicate(value, i, this)) return i;
    }
    return -1;
  }
  filter(predicate: (value: Item, index: number, deque: this) => boolean): Deque<Item> {
    const deque = new Deque<Item>(undefined, { deleteStrategy: this.#deleteStrategy, growthFactor: this.#growthFactor });
    for (let i = 0; i < this.#size; ++i) {
      const intermediate = i + this.#front;
      const value = this.#array[intermediate < this.#array.length ? intermediate : intermediate - this.#array.length];
      if (predicate(value, i, this)) deque.pushBack(value);
    }
    return deque;
  }
  sort(comparator?: (a: Item, b: Item) => number): this {
    const array = new Array(this.#array.length);
    for (let i = 0; i < this.#size; ++i) {
      const intermediate = i + this.#front;
      array[i] = this.#array[intermediate < this.#array.length ? intermediate : intermediate - this.#array.length];
    }
    this.#array = array.toSorted(comparator);
    this.#front = 0;
    this.#back = 0;
    this.#size = this.#array.length;
    if (this.#growthFactor) this.#grow();
    return this;
  }
  toSorted(comparator?: (a: Item, b: Item) => number): Deque<Item> {
    const array = new Array(this.#array.length);
    for (let i = 0; i < this.#size; ++i) {
      const intermediate = i + this.#front;
      array[i] = this.#array[intermediate < this.#array.length ? intermediate : intermediate - this.#array.length];
    }
    return new Deque(array.toSorted(comparator), { deleteStrategy: this.#deleteStrategy, growthFactor: this.#growthFactor });
  }
  includes(value: Item, fromIndex?: number): boolean {
    for (let i = fromIndex ?? 0; i < this.#size; ++i) {
      const intermediate = i + this.#front;
      if (this.#array[intermediate < this.#array.length ? intermediate : intermediate - this.#array.length] === value) return true;
    }
    return false;
  }
  some(callback: (value: Item, index: number, deque: this) => boolean): boolean {
    for (let i = 0; i < this.#size; ++i) {
      const intermediate = i + this.#front;
      if (callback(this.#array[intermediate < this.#array.length ? intermediate : intermediate - this.#array.length], i, this)) return true;
    }
    return false;
  }
  every(callback: (value: Item, index: number, deque: this) => boolean): boolean {
    for (let i = 0; i < this.#size; ++i) {
      const intermediate = i + this.#front;
      if (!callback(this.#array[intermediate < this.#array.length ? intermediate : intermediate - this.#array.length], i, this)) return false;
    }
    return true;
  }
  reduce(callback: (previousValue: Item, currentValue: Item, currentIndex: number, deque: this) => Item): Item;
  reduce<Reduced>(
    callback: (previousValue: Reduced, currentValue: Item, currentIndex: number, deque: this) => Reduced,
    initialValue: Reduced,
  ): Reduced;
  reduce<Reduced = Item>(
    callback: (previousValue: Reduced, currentValue: Item, currentIndex: number, deque: this) => Reduced,
    initialValue?: Reduced,
  ): Reduced {
    if (this.#size === 0) {
      if (typeof initialValue === 'undefined') throw new Error('Reduce of empty array with no initial value');
      return initialValue;
    }
    let [reduced, startIx] = (typeof initialValue === 'undefined' ? [this.#array[this.#front], 1] : [initialValue, 0]) as [Reduced, number];
    for (let i = startIx; i < this.#size; ++i) {
      const intermediate = i + this.#front;
      reduced = callback(reduced, this.#array[intermediate < this.#array.length ? intermediate : intermediate - this.#array.length], i, this);
    }
    return reduced;
  }
  clear(): void {
    this.#array = new Array(this.#startingLength);
    this.#front = 0;
    this.#back = 0;
    this.#size = 0;
  }
  clone(): Deque<Item> {
    return new Deque(this, { deleteStrategy: this.#deleteStrategy, growthFactor: this.#growthFactor });
  }
  *itemsFront(): Generator<Item, void, void> {
    for (let i = 0; i < this.#size; ++i) {
      const intermediate = i + this.#front;
      yield this.#array[intermediate < this.#array.length ? intermediate : intermediate - this.#array.length];
    }
  }
  *itemsBack(): Generator<Item, void, void> {
    for (let i = this.#size - 1; i >= 0; --i) {
      const intermediate = i + this.#front;
      yield this.#array[intermediate < this.#array.length ? intermediate : intermediate - this.#array.length];
    }
  }
  *entriesFront(): Generator<[number, Item], void, void> {
    for (let i = 0; i < this.#size; ++i) {
      const intermediate = i + this.#front;
      yield [i, this.#array[intermediate < this.#array.length ? intermediate : intermediate - this.#array.length]];
    }
  }
  *entriesBack(): Generator<[number, Item], void, void> {
    for (let i = this.#size - 1; i >= 0; --i) {
      const intermediate = i + this.#front;
      yield [i, this.#array[intermediate < this.#array.length ? intermediate : intermediate - this.#array.length]];
    }
  }
  get size() {
    return this.#size;
  }
  // used by DequeArrayLike2
  protected get internalLength() {
    return this.#array.length;
  }
  [Symbol.iterator]() {
    return this.itemsFront();
  }
  [inspect.custom]() {
    return {
      internal: this.#array,
      front: this.#front,
      back: this.#back,
      length: this.#array.length,
      size: this.#size,
    };
  }
}

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array#generic_array_methods

/** `Deque` but it implements `ArrayLike`
 *
 * e.g.,
 * - `new DequeArrayLike(['a', 'b' ,'c'])[1]` returns `b`
 * - `Array.prototype.someMethod.bind(new DequeArrayLike(['a', 'b', 'c']))(...params)` calls `someMethod` as if it were a method of `DequeArrayLike`
 *
 * **This requires proxying which adds overhead to every single method call and property access** */
export class DequeArrayLike<Item> extends Deque<Item> implements ArrayLike<Item> {
  // just for typing - it's overriden by the Proxy returned by the constructor since the `property in target` check fails
  [index: number]: Item;
  // ConstructorParameters only evaluates to the first overload so these need to be reimplemented
  constructor(length?: number, params?: DequeParams);
  constructor(iterable: Iterable<Item>, params?: DequeParams);
  constructor(...params: [p0?: number | Iterable<Item>, p1?: DequeParams]) {
    super(...params as ConstructorParameters<typeof Deque<Item>>);
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy
    // https://github.com/microsoft/TypeScript-Website/blob/5b2c0a7c557102f2b6aa1c736fbea94e9863d82e/packages/documentation/copy/en/handbook-v2/Classes.md?plain=1#L979
    return new Proxy(this, {
      get(target, property) {
        if (property in target) {
          const getter = target[property as keyof typeof target];
          // need to re-bind `this` because js is a silly goose
          return typeof getter === 'function' ? getter.bind(target) : getter;
        }
        if (typeof property === 'string') {
          const index = parseInt(property, 10);
          if (!isNaN(index)) return target.at(index);
        }
      },
      set(target, property, value) {
        if (property in target) {
          const setter = target[property as keyof typeof target];
          return typeof setter === 'function' ? setter.bind(target)(value) : setter;
        }
        if (typeof property === 'string') {
          const index = parseInt(property, 10);
          if (!isNaN(index)) return target.set(index, value);
        }
      },
    });
  }
  get length(): number {
    return this.size;
  }
}

/** `Deque` but it implements `ArrayLike`
 *
 * e.g.,
 * - `new DequeArrayLike2(['a', 'b' ,'c'])[1]` returns `b`
 * - `Array.prototype.someMethod.bind(new DequeArrayLike2(['a', 'b', 'c']))(...params)` calls `someMethod` as if it were a method of `DequeArrayLike2`
 *
 * **This requires defining properties for every possible new array index each time the internal array grows which is very slow**
 *
 * It also adds a small overhead proportional to `length` for each method call */
export class DequeArrayLike2<Item> extends Deque<Item> implements ArrayLike<Item> {
  // just for typing - it's overriden by #defineProperties
  [index: number]: Item;
  #defineProperties(prevSize: number, size: number) {
    // there is an Object.defineProperties but it's not faster
    for (let i = prevSize; i < size; ++i) {
      Object.defineProperty(this, i, {
        get() {
          return this.at(i);
        },
        set(value: Item) {
          return this.set(i, value);
        },
      });
    }
  }
  // ConstructorParameters only evaluates to the first overload so these need to be reimplemented
  constructor(length?: number, params?: DequeParams);
  constructor(iterable: Iterable<Item>, params?: DequeParams);
  constructor(...params: [p0?: number | Iterable<Item>, p1?: DequeParams]) {
    super(...params as ConstructorParameters<typeof Deque<Item>>);
    this.#defineProperties(0, this.internalLength);
    this.emitter.addListener('grow', this.#defineProperties);
  }
  get length(): number {
    return this.size;
  }
}
