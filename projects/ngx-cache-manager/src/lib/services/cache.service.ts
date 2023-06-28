import { Injectable } from '@angular/core';
import { AbstractCache, CacheParams } from '../abstract-cache';
import { LocalStorageCache } from '../local-storage-cache';
import { MemoryCache } from '../memory-cache';
import { SessionStorageCache } from '../session-storage-cache';

@Injectable({
  providedIn: 'root'
})
export class CacheService {
  private map = new Map<string, AbstractCache<any, any>>();

  public constructor() { }

  public create<K, V>(cacheKey: string, type: CacheType, params?: CacheParams<K, V>): AbstractCache<K, V> {
    const cache = this.getCacheByType<K, V>(cacheKey, type, params);
    return this.register(cacheKey, cache);
  }

  public register<K, V>(cacheKey: string, cache: AbstractCache<K, V>): AbstractCache<K, V> {
    this.map.set(cacheKey, cache);
    return cache;
  }

  public has(cacheKey: string): boolean {
    return this.map.has(cacheKey);
  }

  public get<K, V>(cacheKey: string): AbstractCache<K, V> | undefined {
    return this.map.get(cacheKey);
  }

  public remove(cacheKey: string): boolean {
    const cache = this.map.get(cacheKey);

    if (!cache) {
      return false;
    }

    cache.clear();
    this.map.delete(cacheKey);

    return true;
  }

  private getCacheByType<K, V>(cacheKey: string, type: CacheType, params?: CacheParams<K, V>): AbstractCache<K, V> {
    switch (type) {
      case CacheType.Memory:
        return new MemoryCache(params);
      case CacheType.LocalStorage:
        return new LocalStorageCache(cacheKey, params);
      case CacheType.SessionStorage:
        return new SessionStorageCache(cacheKey, params);
      default:
        throw new Error(`Unknown cache type ${type}.`);
    }
  }
}

export enum CacheType {
  Memory,
  LocalStorage,
  SessionStorage
}
