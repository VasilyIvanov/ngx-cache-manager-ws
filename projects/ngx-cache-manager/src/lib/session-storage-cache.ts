import { BrowserStorageCache, BrowserStorageCacheParams } from './browser-storage-cache';

export class SessionStorageCache<K, V> extends BrowserStorageCache<K, V> {
  public constructor(storageKey: string, params?: BrowserStorageCacheParams<K, V>) {
    super(sessionStorage, storageKey, params);
  }
}
