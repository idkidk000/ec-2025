import { inspect } from 'node:util';

/** Wrapper around Set where key is passed though packer and unpacker functions
 *
 * Uses native `Set` methods for speed, but `HashedSet` might be a better choice if unpacking is slow
 */
// `implements Set<Key>` is helpful to verify the shape of the class but it cannot actually be satisfied
export class PackedSet<Key, Packed = string | number | bigint> {
  #set: Set<Packed>;
  constructor(
    public readonly packer: (key: Key) => Packed,
    public readonly unpacker: (hash: Packed) => Key,
    iterable?: Iterable<Key>,
    packedIterable?: Iterable<Packed>,
  ) {
    this.#set = new Set<Packed>((iterable ? [...iterable].map(packer) : packedIterable) ?? null);
  }
  add(key: Key): this {
    this.#set.add(this.packer(key));
    return this;
  }
  delete(key: Key): boolean {
    return this.#set.delete(this.packer(key));
  }
  clear(): void {
    return this.#set.clear();
  }
  difference(other: PackedSet<Key, Packed>): PackedSet<Key, Packed> {
    return new PackedSet(this.packer, this.unpacker, undefined, this.#set.difference(other.#set));
  }
  entries(): SetIterator<[Key, Key]> {
    return this.#set.keys().map((packed) => {
      const key = this.unpacker(packed);
      return [key, key];
    });
  }
  forEach(callback: (value: Key, value2: Key, packedSet: PackedSet<Key, Packed>) => void): void {
    return this.#set.keys().forEach((packed) => {
      const key = this.unpacker(packed);
      return callback(key, key, this);
    });
  }
  has(key: Key): boolean {
    return this.#set.has(this.packer(key));
  }
  intersection(other: PackedSet<Key, Packed>): PackedSet<Key, Packed> {
    return new PackedSet(this.packer, this.unpacker, undefined, this.#set.intersection(other.#set));
  }
  isDisjointFrom(other: PackedSet<Key, Packed>): boolean {
    return this.#set.isDisjointFrom(other.#set);
  }
  isSubsetOf(other: PackedSet<Key, Packed>): boolean {
    return this.#set.isSubsetOf(other.#set);
  }
  isSupersetOf(other: PackedSet<Key, Packed>): boolean {
    return this.#set.isSupersetOf(other.#set);
  }
  keys(): SetIterator<Key> {
    return this.#set.keys().map(this.unpacker);
  }
  get size() {
    return this.#set.size;
  }
  symmetricDifference(other: PackedSet<Key, Packed>): PackedSet<Key, Packed> {
    return new PackedSet(this.packer, this.unpacker, undefined, this.#set.symmetricDifference(other.#set));
  }
  union(other: PackedSet<Key, Packed>): PackedSet<Key, Packed> {
    return new PackedSet(this.packer, this.unpacker, undefined, this.#set.union(other.#set));
  }
  values(): SetIterator<Key> {
    return this.#set.keys().map(this.unpacker);
  }
  clone(): PackedSet<Key, Packed> {
    return new PackedSet(this.packer, this.unpacker, undefined, this.#set);
  }
  [Symbol.iterator]() {
    return this.keys();
  }
  [inspect.custom]() {
    return this.keys().toArray();
  }
}
