type Releaser = () => void;
type Locker = (value: Releaser) => void;

/** Simple mutex similar to the `async-mutex` npm package */
export class Mutex {
  /** `set.keys()` returns in insertion order
   *
   * this could also be:
   * - an array, but FIFO operations are slow
   * - a deque, but i'd prefer to keep these libs independent
   * - a map where the key is a unique symbol generated in `acquire`, and the value is the `locker` function
   */
  #queue = new Set<Locker>();
  #makeReleaser(locker: Locker): Releaser {
    return () => {
      if (!this.#queue.delete(locker)) throw new Error('lock can only be released once');
      // unlock the next locker
      const nextLocker = this.#queue.keys().next().value;
      nextLocker?.(this.#makeReleaser(nextLocker));
    };
  }
  acquire(): Promise<Releaser> {
    const { promise, resolve: locker } = Promise.withResolvers<Releaser>();
    // if the queue is empty, resolve the promise with a releaser function immediately
    // otherwise, it will be resolved by the releaser function before it in the queue being called
    if (this.#queue.size === 0) locker(this.#makeReleaser(locker));
    this.#queue.add(locker);
    return promise;
  }
}

/** Simple `Mutex` wrapper */
export class Semaphore<Item> {
  #mutex = new Mutex();
  #value: Item;
  // deno-lint-ignore ban-types
  constructor(value: Item extends Function ? never : Item) {
    if (typeof value === 'function') throw new Error('a function cannot be used as a semaphore value');
    this.#value = value;
  }
  async update(value: Item): Promise<Item>;
  async update(callback: (prev: Item) => Item): Promise<Item>;
  async update(param: Item | ((prev: Item) => Item)) {
    const release = await this.#mutex.acquire();
    try {
      this.#value = typeof param === 'function' ? (param as (prev: Item) => Item)(this.#value) : param;
      return this.#value;
    } finally {
      release();
    }
  }
  get value() {
    return this.#value;
  }
}
