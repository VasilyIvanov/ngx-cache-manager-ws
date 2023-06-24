import { Utils } from './utils';

export abstract class AbstractCache<K, V> {
  private readonly comparer: (existingKey: K, searchKey: K) => boolean;
  private readonly cloner: <T>(value: T) => T;
  private readonly data: Array<CacheItem<K, V>>;

  public constructor(protected readonly cacheStorage: CacheStorage<K, V>, protected readonly params?: CacheParams<K>) {
    if (!cacheStorage) {
      throw new Error('The cacheStorage parameter must be truthy.');
    }

    if (params) {
      if (params.expiryTime != null && params.expiryTime <= 0) {
        throw new Error(`The expiryTime parameter must be more than zero if provided but is ${params.maxLength}.`);
      }

      if (params.maxLength != null && params.maxLength <= 0) {
        throw new Error(`The maxLength parameter must be more than zero if provided but is ${params.maxLength}.`);
      }
    }

    this.comparer = params?.comparer ?? Utils.compare;
    this.cloner = params?.cloner ?? Utils.clone;

    this.data = cacheStorage.readFromStorage();
    const cleanedByExpiryTime = this.cleanByExpiryTime();
    const cleanedByMaxLength = this.cleanByMaxLength();

    if (cleanedByExpiryTime || cleanedByMaxLength) {
      this.save();
    }
  }

  public getLength(): number {
    if (this.cleanByExpiryTime()) {
      this.save();
    }
    return this.data.length;
  }

  public forEach(callbackfn: (value: CacheItem<K, V>, index: number) => void): void {
    if (this.cleanByExpiryTime()) {
      this.save();
    }
    this.data.forEach(callbackfn);
  }

  public has(key: K): boolean {
    if (this.cleanByExpiryTime()) {
      this.save();
    }
    return this.getItemIdx(key) >= 0;
  }

  public get(key: K): V | undefined {
    if (this.cleanByExpiryTime()) {
      this.save();
    }
    const existingIdx = this.getItemIdx(key);
    return existingIdx >= 0 ? this.data[existingIdx].value : undefined;
  }

  public set(key: K, value: V, options?: CacheSetOptions): void {
    const exists = this.has(key);

    if (exists) {
      if (Utils.hasFlag(options, CacheSetOptions.ThrowIfExists)) {
        throw new Error(`Key ${key} already exists.`);
      }

      this.delete(key);
    } else if (Utils.hasFlag(options, CacheSetOptions.ThrowIfNotExists)) {
      throw new Error(`Key ${key} doesn't exist.`);
    }

    const keyToSet = Utils.hasFlag(options, CacheSetOptions.CloneKey) ? this.cloner(key) : key;
    const valueToSet = Utils.hasFlag(options, CacheSetOptions.CloneValue) ? this.cloner(value) : value;
    const now = Date.now();

    this.data.unshift({ key: keyToSet, value: valueToSet, set: now });

    if (!exists) {
      this.cleanByMaxLength();
    }

    this.save();
  }

  public delete(key: K): boolean {
    this.cleanByExpiryTime();
    const existingIdx = this.getItemIdx(key);

    if (existingIdx >= 0) {
      this.data.splice(existingIdx, 1);
      this.save();
      return true;
    }

    return false;
  }

  public clear(): void {
    this.data.length = 0;
    this.save();
  };

  protected cleanByExpiryTime(): boolean {
    const initialLenth = this.data.length;

    if (this.params?.expiryTime) {
      const expiryTime = this.params.expiryTime;
      const now = Date.now();

      for (let i = this.data.length - 1; i >= 0; i--) {
        if (now - this.data[i].set >= expiryTime) {
          this.data.splice(i, 1);
        }
      }
    }

    return this.data.length !== initialLenth;;
  }

  protected cleanByMaxLength(): boolean {
    if (this.params?.maxLength && this.data.length > this.params.maxLength) {
      this.data.length = this.params.maxLength;
      return true;
    }

    return false;
  }

  private getItemIdx(key: K): number {
    return this.data.findIndex((d) => this.comparer(d.key, key));
  }

  private save(): void {
    this.cacheStorage.writeToStorage(this.cloner(this.data));
  }
}

export interface CacheStorage<K, V> {
  readFromStorage(): Array<CacheItem<K, V>>;
  writeToStorage(data: Array<CacheItem<K, V>>): void;
}

export interface CacheItem<K, V> {
  readonly key: K;
  value: V;
  set: number;
}

export interface CacheParams<K> {
  readonly comparer?: (existingKey: K, searchKey: K) => boolean;
  readonly cloner?: <T>(value: T) => T;
  readonly expiryTime?: number;
  readonly maxLength?: number;
}

export enum CacheSetOptions {
  None = 0,
  CloneKey = 1,
  CloneValue = 2,
  ThrowIfExists = 4,
  ThrowIfNotExists = 8
}
