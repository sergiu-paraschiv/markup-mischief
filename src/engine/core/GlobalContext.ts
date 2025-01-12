/* eslint-disable @typescript-eslint/no-explicit-any */

export default class GlobalContext {
  private static _data = new Map<string, any>();
  static get<T = any>(key: string): T {
    return this._data.get(key);
  }

  static set<T = any>(key: string, value: T) {
    this._data.set(key, value);
  }
}
