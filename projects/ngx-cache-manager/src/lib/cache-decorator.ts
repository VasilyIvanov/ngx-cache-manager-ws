import { isObservable, last, of } from "rxjs";
import { AbstractCache, CacheParams } from "./abstract-cache";
import { NgxCacheManagerModule } from "./ngx-cache-manager.module";
import { CacheService, CacheType } from "./services/cache.service";

export function cache<V>(params?: CacheDecoratorParams<V>): MethodDecorator {
  return function (target: Object | Function, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<any>): TypedPropertyDescriptor<any> | void {
    const className: string = typeof target === 'object' ? target.constructor.name : target.name;
    const cacheKey = params?.cacheKey ?? `${className}.${propertyKey.toString()}`;
    const original = descriptor.value;
    let cache: AbstractCache<any, CachedValue<V>>;

    descriptor.value = function (...args: any) {
      if (!cache) {
        const cacheService = NgxCacheManagerModule.injector.get(CacheService);
        cache = params?.cache instanceof AbstractCache
          ? cacheService.register(cacheKey, params.cache)
          : cacheService.create(cacheKey, params?.cache ?? CacheType.Memory, params);
      }

      if (cache.has(args)) {
        const cached = cache.get(args);

        if (!cached) {
          throw new Error(`There is a cache key (${args}) in the instance ${cacheKey} but no value`);
        }

        switch (cached.valueType) {
          case CachedValueType.Observable:
            return of(cached.value);
          case CachedValueType.Promise:
            return Promise.resolve(cached.value);
          default:
            return cached.value;
        }
      }

      const result = original.call(this, ...args);

      if (isObservable(result)) {
        result.pipe(last()).subscribe(value => cache.set({ value: value as V, valueType: CachedValueType.Observable }, args));
      } else if (result instanceof Promise) {
        result.then(value => cache.set({ value, valueType: CachedValueType.Promise }, args));
      } else {
        cache.set({ value: result, valueType: CachedValueType.Normal }, args);
      }

      return result;
    };
  }
}

export interface CacheDecoratorParams<V> extends CacheParams<string, CachedValue<V>> {
  readonly cache?: CacheType | AbstractCache<string, CachedValue<V>>;
  readonly cacheKey?: string;
}

interface CachedValue<V> {
  value: V;
  valueType: CachedValueType;
}

export enum CachedValueType {
  Normal,
  Promise,
  Observable
}
