import { inspect } from 'node:util';

/** Wrapper around Map where key is passed though packer and unpacker functions
 *
 * `HashedMap` might be a better choice if unpacking is slow
 */
// `implements Map<Key, Value>` is helpful to verify the shape of the class but it cannot actually be satisfied
export class PackedMap<Key, Value, Packed = string | number | bigint> {
  #map: Map<Packed, Value>;
  constructor(
    public readonly packer: (key: Key) => Packed,
    public readonly unpacker: (packed: Packed) => Key,
    iterable?: Iterable<[Key, Value]>,
  ) {
    this.#map = new Map<Packed, Value>(iterable ? [...iterable].map(([key, value]) => [packer(key), value]) : null);
  }
  clear() {
    return this.#map.clear();
  }
  delete(key: Key) {
    return this.#map.delete(this.packer(key));
  }
  entries(): MapIterator<[Key, Value]> {
    return this.#map.entries().map(([packed, value]) => [this.unpacker(packed), value]);
  }
  forEach(callback: (value: Value, key: Key, packedMap: PackedMap<Key, Value, Packed>) => void) {
    return this.#map.entries().forEach(([packed, value]) => callback(value, this.unpacker(packed), this));
  }
  get(key: Key) {
    return this.#map.get(this.packer(key));
  }
  has(key: Key) {
    return this.#map.has(this.packer(key));
  }
  keys(): MapIterator<Key> {
    return this.#map.keys().map(this.unpacker);
  }
  set(key: Key, value: Value) {
    this.#map.set(this.packer(key), value);
    return this;
  }
  get size() {
    return this.#map.size;
  }
  values(): MapIterator<Value> {
    return this.#map.values();
  }
  [Symbol.iterator]() {
    return this.entries();
  }
  [inspect.custom]() {
    return this.entries().toArray();
  }
}
