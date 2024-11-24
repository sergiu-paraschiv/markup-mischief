export default class AsepriteCache<T> {
  private cache: Map<string, Promise<T>> = new Map();

  async get(key: string, load: () => Promise<T>): Promise<T> {
    let cached = this.cache.get(key);

    if (!cached) {
      cached = load();
      this.cache.set(key, cached);
    }

    return cached;
  }
}
