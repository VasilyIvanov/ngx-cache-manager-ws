import { BrowserStorageCache, BrowserStorageCacheParams } from './browser-storage-cache';

export class LocalStorageCache<K, V> extends BrowserStorageCache<K, V> {
  public constructor(storageKey: string, params?: BrowserStorageCacheParams<K>) {
    super(localStorage, storageKey, params);
  }
}
