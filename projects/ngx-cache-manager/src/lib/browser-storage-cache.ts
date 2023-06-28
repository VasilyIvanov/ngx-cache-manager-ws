import { AbstractCache, CacheItem, CacheParams, CacheStorage } from './abstract-cache';
import { SmartSerializer } from './smart-serializer';

export abstract class BrowserStorageCache<K, V> extends AbstractCache<K, V> {
  public constructor(storage: Storage, storageKey: string, params?: BrowserStorageCacheParams<K, V>) {
    super(new BrowserCacheStorage<K, V>(storage, storageKey, params?.serializer ?? new SmartSerializer()), params);
  }
}

export interface BrowserStorageCacheParams<K, V> extends CacheParams<K, V> {
  readonly serializer?: Serializer;
}

export interface Serializer {
  serialize(value: object): string;
  deserialize<T>(value: string): T;
}

class BrowserCacheStorage<K, V> implements CacheStorage<K, V> {
  public constructor(private readonly storage: Storage, private readonly storageKey: string, private readonly serializer: Serializer) { }

  public readFromStorage(): Array<CacheItem<K, V>> {
    const serialized = this.storage.getItem(this.storageKey);
    const deserialized = Array.isArray(serialized) ? this.serializer.deserialize<Array<CacheItem<K, V>>>(serialized) : new Array<CacheItem<K, V>>();
    return deserialized;
  }

  public writeToStorage(data: Array<CacheItem<K, V>>): void {
    if (data.length > 0) {
      this.storage.setItem(this.storageKey, this.serializer.serialize(data));
    } else {
      this.storage.removeItem(this.storageKey);
    }
  }
}
