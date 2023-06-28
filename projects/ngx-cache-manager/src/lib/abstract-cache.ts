import { CacheCustomizer } from './cache-customizer';
import { Utils } from './utils';

export abstract class AbstractCache<K, V> {
  private readonly customizer: CacheCustomizer<K, V>;
  private readonly data: Array<CacheItem<K, V>>;

  public constructor(protected readonly cacheStorage: CacheStorage<K, V>, protected readonly params?: CacheParams<K, V>) {
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

    this.customizer = params?.customizer ?? new CacheCustomizer();
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
    return this.getItemIdx(key, Utils.hasFlag(this.params?.options, CacheOptions.ExactMatch)) >= 0;
  }

  public get(key: K): V | undefined {
    if (this.cleanByExpiryTime()) {
      this.save();
    }
    const existingIdx = this.getItemIdx(key, Utils.hasFlag(this.params?.options, CacheOptions.ExactMatch));
    return existingIdx >= 0
      ? this.customizer.postProcessData(this.data[existingIdx].value, key)
      : undefined;
  }

  public set(...args: K extends void ? [value: V] : [key: K, value: V]): void {
    if (args.length === 1) {
      this.setInternal(undefined as K, args[0]);
    } else {
      this.setInternal(args[0], args[1]);
    }
  }

  public delete(key: K): boolean {
    this.cleanByExpiryTime();
    const existingIdx = this.getItemIdx(key, Utils.hasFlag(this.params?.options, CacheOptions.ExactMatch));

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

  private setInternal(key: K, value: V): void {
    const exists = this.has(key);

    if (exists) {
      if (Utils.hasFlag(this.params?.options, CacheOptions.ThrowIfExists)) {
        throw new Error(`Key ${this.getKeyString(key)} already exists.`);
      }

      this.delete(key);
    }

    const keyToSet = this.customizer.preProcessParams(Utils.hasFlag(this.params?.options, CacheOptions.CloneKey) ? this.customizer.clone(key) : key, this);
    const valueToSet = Utils.hasFlag(this.params?.options, CacheOptions.CloneValue) ? this.customizer.clone(value) : value;
    const now = Date.now();

    this.data.unshift({ key: keyToSet, value: valueToSet, set: now });

    if (!exists) {
      this.cleanByMaxLength();
    }

    this.save();
  }

  private getItemIdx(key: K, exactMatch: boolean): number {
    const preparedKey = this.customizer.preProcessParams(key, this);
    return this.data.findIndex((d) => exactMatch ? Utils.compare(d.key, key) : this.customizer.compare(d.key, key));
  }

  private save(): void {
    this.cacheStorage.writeToStorage(this.customizer.clone(this.data));
  }

  private getKeyString(key: K): string {
    switch (typeof key) {
      case 'string':
        return key;
      case 'object':
        return JSON.stringify(key).slice(0, 99);
      default:
        return String(key);
    }
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

export interface CacheParams<K, V> {
  readonly expiryTime?: number;
  readonly maxLength?: number;
  readonly customizer?: CacheCustomizer<K, V>;
  readonly options?: CacheOptions;
}

export enum CacheOptions {
  None = 0,
  ExactMatch = 1,
  CloneKey = 2,
  CloneValue = 4,
  ThrowIfExists = 8
}
