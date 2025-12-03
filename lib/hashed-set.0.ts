import { inspect } from 'node:util';

/** Wrapper around Map which stores the original Key object in the Map value and reimplements all Set methods
 *
 * `PackedSet` might be a better choice if you have an unpacker and are doing a lot of Set-to-Set operations
 */
// `implements Set<Key>` is helpful to verify the shape of the class but it cannot actually be satisfied
export class HashedSet<Key, Hash = string | number | bigint> {
  #map: Map<Hash, Key>;
  constructor(
    public readonly hasher: (key: Key) => Hash,
    iterable?: Iterable<Key>,
    hashedIterable?: Iterable<[Hash, Key]>,
  ) {
    this.#map = new Map<Hash, Key>((iterable ? [...iterable].map((key) => [hasher(key), key]) : hashedIterable) ?? null);
  }
  add(key: Key): this {
    this.#map.set(this.hasher(key), key);
    return this;
  }
  delete(key: Key): boolean {
    return this.#map.delete(this.hasher(key));
  }
  clear(): void {
    return this.#map.clear();
  }
  difference(other: HashedSet<Key, Hash>): HashedSet<Key, Hash> {
    return new HashedSet(this.hasher, undefined, this.#map.entries().filter(([hash]) => !other.#map.has(hash)));
  }
  entries(): SetIterator<[Key, Key]> {
    return this.#map.values().map((key) => [key, key]);
  }
  forEach(callback: (value: Key, value2: Key, hashedSet: HashedSet<Key, Hash>) => void): void {
    return this.#map.values().forEach((key) => callback(key, key, this));
  }
  has(key: Key): boolean {
    return this.#map.has(this.hasher(key));
  }
  intersection(other: HashedSet<Key, Hash>): HashedSet<Key, Hash> {
    return new HashedSet(this.hasher, undefined, this.#map.entries().filter(([hash]) => other.#map.has(hash)));
  }
  isDisjointFrom(other: HashedSet<Key, Hash>): boolean {
    return this.#map.keys().every((hash) => !other.#map.has(hash));
  }
  isSubsetOf(other: HashedSet<Key, Hash>): boolean {
    return this.#map.keys().every((hash) => other.#map.has(hash));
  }
  isSupersetOf(other: HashedSet<Key, Hash>): boolean {
    return other.#map.keys().every((hash) => this.#map.has(hash));
  }
  keys(): SetIterator<Key> {
    return this.#map.values();
  }
  get size() {
    return this.#map.size;
  }
  symmetricDifference(other: HashedSet<Key, Hash>) {
    return new HashedSet(this.hasher, undefined, [
      ...this.#map.entries().filter(([hash]) => !other.#map.has(hash)),
      ...other.#map.entries().filter(([hash]) => !this.#map.has(hash)),
    ]);
  }
  union(other: HashedSet<Key, Hash>): HashedSet<Key, Hash> {
    return new HashedSet(this.hasher, undefined, [...this.#map.entries(), ...other.#map.entries()]);
  }
  values(): SetIterator<Key> {
    return this.#map.values();
  }
  clone(): HashedSet<Key, Hash> {
    return new HashedSet(this.hasher, undefined, this.#map.entries());
  }
  [Symbol.iterator]() {
    return this.keys();
  }
  [inspect.custom]() {
    return this.entries().toArray();
  }
}
