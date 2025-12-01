export class Counter<Key, Value = number | bigint> extends Map<Key, Value> {
  constructor(public readonly starting: Value, public readonly defaultAdd: Value, iterable?: Iterable<[Key, Value]>) {
    super(iterable ?? null);
  }
  add(item: Key, count?: Value): Value {
    // `Value` has been narrowed to either `number` or `bigint` according to `starting`, so i correctly can't provide a mix of numbers and bigints in either the constructor or `add`
    // but typescript doesn't think that the `+` operator is valid for `Value` and `Value`
    const value = ((this.get(item) ?? this.starting) as number) + ((count ?? this.defaultAdd) as number) as Value;
    this.set(item, value);
    return value;
  }
  override forEach(callbackfn: (value: Value, key: Key, counter: Counter<Key, Value>) => void): void {
    return super.forEach((value, key) => callbackfn(value, key, this));
  }
}
