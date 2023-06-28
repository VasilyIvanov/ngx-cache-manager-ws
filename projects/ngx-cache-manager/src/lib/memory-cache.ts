import { AbstractCache, CacheItem, CacheParams, CacheStorage } from './abstract-cache';

export class MemoryCache<K, V> extends AbstractCache<K, V> {
  public constructor(params?: CacheParams<K, V>) {
    super(new MemoryCacheStorage<K, V>(), params);
  }
}

class MemoryCacheStorage<K, V> implements CacheStorage<K, V> {
  public readFromStorage(): Array<CacheItem<K, V>> {
    return new Array<CacheItem<K, V>>();
  }

  public writeToStorage(data: Array<CacheItem<K, V>>): void { }
}
