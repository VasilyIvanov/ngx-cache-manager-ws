import type { AbstractCache } from './abstract-cache';
import { Utils } from './utils';

export class CacheCustomizer<K, V> {
  public clone<T>(value: T): T {
    return Utils.clone(value);
  }

  public compare(cachedParams: K, requestParams: K): boolean {
    return Utils.compare(cachedParams, requestParams);
  }

  public preProcessParams(params: K, cache: AbstractCache<K, V>): K {
    return params;
  }

  public postProcessData(data: V, originalParams: K): V {
    return data;
  }
}
