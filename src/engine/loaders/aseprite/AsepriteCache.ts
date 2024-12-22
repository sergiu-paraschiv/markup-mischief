export default class AsepriteCache<T> {
  private cache = new Map<string, Promise<T>>();

  async get(key: string, load: () => Promise<T>): Promise<T> {
    let cached = this.cache.get(key);

    if (!cached) {
      cached = load();
      this.cache.set(key, cached);
    }

    return cached;
  }
}
