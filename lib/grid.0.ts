import { inspect } from 'node:util';
import { Point2DLike } from '@/lib/point2d.0.ts';

export enum CoordSystem {
  Rc,
  Xy,
}
export enum GridAxis {
  Horizontal,
  Vertical,
}
export interface GridCoord {
  x: number;
  y: number;
  r: number;
  c: number;
  i: number;
}
export type GridOptionsWithFill<Item> = { rows: number; cols: number; fill: Item | ((coord: GridCoord) => Item) };
export type GridOptionsWithCells<Item> = { cells: Item[]; cols: number };
export type CellInspector<Item> = (cell: Item, coord: GridCoord) => string;
export type CoordParams<System extends CoordSystem, Index extends boolean> =
  | (System extends CoordSystem.Rc ? [r: number, c: number] : [x: number, y: number])
  | [point: Point2DLike]
  | [index: Index extends true ? number : never];

export class Grid<Item, System extends CoordSystem> {
  #rows: number;
  #cols: number;
  #array: Item[];
  readonly system: System;
  readonly inspector?: CellInspector<Item>;
  constructor(data: Item[][], system: System, inspector?: CellInspector<Item>);
  constructor(data: GridOptionsWithFill<Item>, system: System, inspector?: CellInspector<Item>);
  constructor(data: GridOptionsWithCells<Item>, system: System, inspector?: CellInspector<Item>);
  constructor(data: Grid<Item, System>);
  constructor(
    data: Grid<Item, System> | Item[][] | GridOptionsWithFill<Item> | GridOptionsWithCells<Item>,
    system?: System,
    inspector?: CellInspector<Item>,
  ) {
    if (data instanceof Grid) {
      // Grid
      this.#rows = data.#rows;
      this.#cols = data.#cols;
      this.#array = [...data.#array];
      this.system = data.system;
      this.inspector = data.inspector;
    } else if (typeof system !== 'undefined') {
      this.system = system;
      this.inspector = inspector;
      if (Array.isArray(data)) {
        // Item[][]
        this.#rows = data.length;
        this.#cols = data.length ? data[0].length : 0;
        this.#array = data.flat(1);
      } else if (data && 'fill' in data) {
        // GridOptionsWithFill
        this.#rows = data.rows;
        this.#cols = data.cols;
        this.#array = new Array<Item>(data.rows * data.cols);
        for (let i = 0; i < this.#array.length; ++i)
          this.#array[i] = typeof data.fill === 'function' ? (data.fill as (coord: GridCoord) => Item)(this.#unsafeIndexToCoord(i)) : data.fill;
      } else if (data && 'cells' in data) {
        // GridOptionsWithCells
        this.#rows = Math.floor(data.cells.length / (data.cols || 1));
        this.#cols = data.cols;
        this.#array = data.cells;
      } else { throw new Error('invalid constructor params - unrecognised data'); }
    } else { throw new Error('invalid constructor params - missing system'); }
  }

  // getters
  get rows() {
    return this.#rows;
  }
  get cols() {
    return this.#cols;
  }
  get internal() {
    return this.#array;
  }
  get length() {
    return this.#array.length;
  }

  // private unsafe methods
  #unsafeIndexToCoord(i: number): GridCoord {
    const r = Math.floor(i / this.#cols);
    const c = i - r * this.#cols;
    const y = this.#rows - r - 1;
    return { x: c, y, r, c, i };
  }
  #unsafeRcToIndex(r: number, c: number): number {
    return r * this.#cols + c;
  }
  #unsafeXyToIndex(x: number, y: number): number {
    return (this.#rows - y - 1) * this.#cols + x;
  }

  // methods
  inBounds(...[p0, p1]: CoordParams<System, true>): boolean {
    // Point2DLike
    if (typeof p0 === 'object') return p0.x >= 0 && p0.x < this.#cols && p0.y >= 0 && p0.y < this.#rows;
    // index
    if (typeof p1 === 'undefined') return p0 >= 0 && p0 < this.#array.length;
    // r,c / x,y
    const [r, c] = this.system === CoordSystem.Rc ? [p0, p1] : [p1, p0];
    return r >= 0 && r <= this.#rows - 1 && c >= 0 && c <= this.#cols - 1;
  }
  /** Throws on oob */
  indexToCoord(i: number): GridCoord {
    if (this.#array && (i < 0 || i > this.#array.length - 1))
      throw new Error(`out of bounds: {i: ${i}}, array.length: ${this.#array.length}`);
    return this.#unsafeIndexToCoord(i);
  }
  /** Throws on oob */
  coordToIndex(...[p0, p1]: CoordParams<System, false>): number {
    if (!this.inBounds(p0 as never, p1 as never)) throw new Error('out of bounds');
    return typeof p0 === 'object'
      ? this.#unsafeXyToIndex(p0.x, p0.y)
      : this.system === CoordSystem.Rc
      ? this.#unsafeRcToIndex(p0, p1 as number)
      : this.#unsafeXyToIndex(p0, p1 as number);
  }
  find(predicate: (value: Item, coord: GridCoord, grid: this) => boolean): (GridCoord & { value: Item }) | undefined {
    const index = this.#array.findIndex((value, i) => predicate(value, this.#unsafeIndexToCoord(i), this));
    if (index > -1) return { ...this.#unsafeIndexToCoord(index), value: this.#array[index] };
  }
  findLast(predicate: (value: Item, coord: GridCoord, grid: this) => boolean): (GridCoord & { value: Item }) | undefined {
    const index = this.#array.findLastIndex((value, i) => predicate(value, this.#unsafeIndexToCoord(i), this));
    if (index > -1) return { ...this.#unsafeIndexToCoord(index), value: this.#array[index] };
  }
  *findAll(predicate: (value: Item, coord: GridCoord, grid: this) => boolean): Generator<GridCoord & { value: Item }, void, void> {
    for (let i = 0; i < this.#array.length; ++i) {
      const coord = this.#unsafeIndexToCoord(i);
      const value = this.#array[i];
      if (predicate(value, coord, this)) yield { ...coord, value };
    }
  }
  some(callback: (value: Item, coord: GridCoord, grid: this) => boolean): boolean {
    for (let i = 0; i < this.#array.length; ++i)
      if (callback(this.#array[i], this.#unsafeIndexToCoord(i), this)) return true;
    return false;
  }
  every(callback: (value: Item, coord: GridCoord, grid: this) => boolean): boolean {
    for (let i = 0; i < this.#array.length; ++i)
      if (!callback(this.#array[i], this.#unsafeIndexToCoord(i), this)) return false;
    return true;
  }
  fill(value: Item): void;
  fill(updater: (value: Item, coord: GridCoord, grid: this) => Item): void;
  fill(param: Item | ((value: Item, coord: GridCoord, grid: this) => Item)) {
    for (let i = 0; i < this.#array.length; ++i) {
      this.#array[i] = typeof param === 'function'
        ? (param as (value: Item, coord: GridCoord, grid: this) => Item)(this.#array[i], this.#unsafeIndexToCoord(i), this)
        : param;
    }
  }

  // row/col/cell iterator, get, and set methods
  *rowItems(): Generator<Item[], void, void> {
    if (this.system === CoordSystem.Rc) { for (let r = 0; r < this.#rows; ++r) yield this.#array.slice(r * this.#cols, (r + 1) * this.#cols); }
    else { for (let r = this.#rows - 1; r >= 0; --r) yield this.#array.slice(r * this.#cols, (r + 1) * this.#cols); }
  }
  *rowEntries(): Generator<[{ r: number; y: number }, Item[]], void, void> {
    if (this.system === CoordSystem.Rc) {
      for (let r = 0; r < this.#rows; ++r) yield [{ r, y: this.#rows - 1 - r }, this.#array.slice(r * this.#cols, (r + 1) * this.#cols)];
    } else { for (let r = this.#rows - 1; r >= 0; --r) yield [{ r, y: this.#rows - 1 - r }, this.#array.slice(r * this.#cols, (r + 1) * this.#cols)]; }
  }
  rowAt(...[p0]: System extends CoordSystem.Rc ? [r: number] : [y: number]): Item[] | undefined {
    if (p0 < 0 || p0 > this.#rows - 1) return;
    const r = this.system === CoordSystem.Rc ? p0 : this.#rows - 1 - p0;
    return this.#array.slice(r * this.#cols, (r + 1) * this.#cols);
  }
  *colItems(): Generator<Item[], void, void> {
    const col = new Array<Item>(this.#rows);
    for (let c = 0; c < this.#cols; ++c) {
      for (let r = 0; r < this.#rows; ++r) col[r] = this.#array[this.#cols * r + c];
      yield col;
    }
  }
  *colEntries(): Generator<[{ c: number; x: number }, Item[]], void, void> {
    const col = new Array<Item>(this.#rows);
    for (let c = 0; c < this.#cols; ++c) {
      for (let r = 0; r < this.#rows; ++r) col[r] = this.#array[this.#cols * r + c];
      yield [{ c, x: c }, col];
    }
  }
  colAt(...[p0]: System extends CoordSystem.Rc ? [c: number] : [x: number]): Item[] | undefined {
    if (p0 < 0 || p0 > this.#cols - 1) return;
    const col = new Array<Item>(this.#rows);
    for (let r = 0; r < this.#rows; ++r) col[r] = this.#array[this.#cols * r + p0];
    return col;
  }
  *cellItems(): Generator<Item, void, void> {
    for (const cell of this.#array) yield cell;
  }
  *cellEntries(): Generator<[GridCoord, Item], void, void> {
    for (const [i, cell] of this.#array.entries()) yield [this.#unsafeIndexToCoord(i), cell];
  }
  cellAt(...[p0, p1]: CoordParams<System, true>): Item | undefined {
    if (typeof p1 === 'undefined' && typeof p0 === 'number') return this.#array.at(p0);
    if (!this.inBounds(p0 as never, p1 as never)) return;
    return this.#array[
      typeof p0 === 'object'
        ? this.#unsafeXyToIndex(p0.x, p0.y)
        : this.system === CoordSystem.Rc
        ? this.#unsafeRcToIndex(p0, p1 as number)
        : this.#unsafeXyToIndex(p0, p1 as number)
    ];
  }
  cellSet(
    ...[p0, p1, p2]:
      | (System extends CoordSystem.Rc ? [r: number, c: number, value: Item] : [x: number, y: number, value: Item])
      | [point: Point2DLike, value: Item]
      | [index: number, value: Item]
  ): Item {
    if (typeof p2 === 'undefined') {
      if (!this.inBounds(p0 as number)) throw new Error('out of bounds');
      this.#array[typeof p0 === 'number' ? p0 : this.#unsafeXyToIndex(p0.x, p0.y)] = p1 as Item;
      return p1 as Item;
    }
    if (!this.inBounds(p0 as never, p1 as never)) throw new Error('out of bounds');
    this.#array[this.system === CoordSystem.Rc ? this.#unsafeRcToIndex(p0 as number, p1 as number) : this.#unsafeXyToIndex(p0 as number, p1 as number)] = p2;
    return p2;
  }
  cellSetAll(updater: (prev: Item, coord: GridCoord) => Item): void {
    for (const [i, prev] of this.#array.entries()) this.#array[i] = updater(prev, this.#unsafeIndexToCoord(i));
  }

  // local transforms
  /** Mutates this `Grid` instance */
  rotate(angle: 90 | 180 | 270): this {
    if (angle === 180) {
      this.#array.reverse();
      return this;
    }
    if (angle === 90 || angle === 270) {
      const array = new Array<Item>(this.#array.length);
      for (let r = 0; r < this.#rows; ++r) {
        for (let c = 0; c < this.#cols; ++c) {
          const value = this.#array[this.#unsafeRcToIndex(r, c)];
          if (angle === 90) array[c * this.#rows + (this.#rows - 1 - r)] = value;
          else if (angle === 270) array[(this.#cols - 1 - c) * this.#rows + r] = value;
        }
      }
      this.#array = array;
      [this.#rows, this.#cols] = [this.#cols, this.#rows];
      return this;
    }
    throw new Error('invalid rotation angle');
  }
  /** Mutates this `Grid` instance */
  mirror(axis: GridAxis): this {
    if (![GridAxis.Horizontal, GridAxis.Vertical].includes(axis)) throw new Error('invalid mirror axis');
    const array = new Array<Item>(this.#array.length);
    for (let r = 0; r < this.#rows; ++r) {
      for (let c = 0; c < this.#cols; ++c) {
        const value = this.#array[this.#unsafeRcToIndex(r, c)];
        if (axis === GridAxis.Horizontal) array[this.#unsafeRcToIndex(r, this.#cols - 1 - c)] = value;
        else if (axis === GridAxis.Vertical) array[this.#unsafeRcToIndex(this.#rows - 1 - r, c)] = value;
      }
    }
    this.#array = array;
    return this;
  }
  /** Mutates this `Grid` instance */
  translate(...[p0, p1]: CoordParams<System, false>): this {
    // mod here will not meaningfully impact performance
    const [offsetR, offsetC] = typeof p0 === 'object'
      ? [p0.y % this.#cols, p0.x % this.#rows]
      : this.system === CoordSystem.Rc
      ? [p0 % this.#rows, p1 as number % this.#cols]
      : [p1 as number % this.#cols, p0 % this.#rows];
    if (offsetR === 0 && offsetC === 0) return this;
    const array = new Array<Item>(this.#array.length);
    for (let r = 0; r < this.#rows; ++r) {
      const intermediateDestR = r + offsetR;
      const destR = intermediateDestR < 0
        ? intermediateDestR + this.#rows
        : intermediateDestR > this.#rows - 1
        ? intermediateDestR - this.#rows
        : intermediateDestR;
      for (let c = 0; c < this.#cols; ++c) {
        const intermediateDestC = c + offsetC;
        const destC = intermediateDestC < 0
          ? intermediateDestC + this.#cols
          : intermediateDestC > this.#cols - 1
          ? intermediateDestC - this.#cols
          : intermediateDestC;
        array[this.#unsafeRcToIndex(destR, destC)] = this.#array[this.#unsafeRcToIndex(r, c)];
      }
    }
    this.#array = array;
    return this;
  }

  // copy transforms
  /** Returns a new `Grid` instance */
  toRotated(angle: 90 | 180 | 270): Grid<Item, System> {
    const grid = new Grid(this);
    return grid.rotate(angle);
  }
  /** Returns a new `Grid` instance */
  toMirrored(axis: GridAxis): Grid<Item, System> {
    const grid = new Grid(this);
    grid.mirror(axis);
    return grid;
  }
  /** Returns a new `Grid` instance */
  toTranslated(...params: CoordParams<System, false>): Grid<Item, System> {
    const grid = new Grid(this);
    grid.translate(params as never);
    return grid;
  }

  [inspect.custom]() {
    const maxLength = Math.ceil(Math.log10(this.#rows));
    return `rows: ${this.#rows}, cols: ${this.#cols}\n${
      this.rowItems().map((row, r) =>
        `${(this.system === CoordSystem.Rc ? r : this.#rows - r - 1).toString().padStart(maxLength, ' ')}: ${
          row.map((cell, c) => this.inspector?.(cell, this.#unsafeIndexToCoord(r * this.#cols + c)) ?? cell).join('')
        }`
      ).toArray().join('\n')
    }`;
  }
}
