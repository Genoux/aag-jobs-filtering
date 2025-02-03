// utils/cache.ts
export class CacheManager<K, V> {
  private cache: Map<K, V> = new Map()

  async getOrSet(
    key: K,
    findFn: () => Promise<V | null>,
    createFn: () => Promise<V>,
  ): Promise<V> {
    const cachedValue = this.cache.get(key)
    if (cachedValue) {
      return cachedValue
    }

    const existingValue = await findFn()
    if (existingValue) {
      this.cache.set(key, existingValue)
      return existingValue
    }

    const newValue = await createFn()
    this.cache.set(key, newValue)
    return newValue
  }

  set(key: K, value: V): void {
    this.cache.set(key, value)
  }

  get(key: K): V | undefined {
    return this.cache.get(key)
  }

  clear(): void {
    this.cache.clear()
  }
}
