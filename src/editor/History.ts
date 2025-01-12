export default class History<T = string> {
  private history: T[];
  private index: number;

  constructor(
    initial: T,
    private readonly onChange: (item: T) => void
  ) {
    this.history = [initial];
    this.index = 0;
  }

  add(item: T) {
    this.index += 1;
    this.history = [...this.history.slice(0, this.index), item];
  }

  getUndo() {
    if (this.index > 0) {
      return () => {
        this.index -= 1;
        this.onChange(this.history[this.index]);
      };
    }

    return undefined;
  }

  getRedo() {
    if (this.index < this.history.length - 1) {
      return () => {
        this.index += 1;
        this.onChange(this.history[this.index]);
      };
    }

    return undefined;
  }

  getCurrentData(): T {
    return this.history[this.index];
  }
}
