import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { delay, of, take } from 'rxjs';
import { DataStatus } from '../cached-data-loader';
import { MemoryCache } from '../memory-cache';

import { CacheService, CacheType } from './cache.service';

describe('CacheService', () => {
  let service: CacheService;
  const key1 = 'testKey1';

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CacheService);
  });

  afterEach(() => {
    service.remove(key1);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should create cache instances', () => {
    const instance = service.create(key1, CacheType.Memory, { expiryTime: 5000 });
    expect(instance).toBeTruthy();
  });

  it('should register cache instances', () => {
    const cache = new MemoryCache<string, string>();
    service.register(key1, cache);
    expect(service.has(key1)).toBeTruthy();
  });

  it('should have a key', () => {
    service.create(key1, CacheType.Memory, { expiryTime: 5000 });
    expect(service.has(key1)).toBeTrue();
    expect(service.has('something')).toBeFalse();
  });

  it('should get instances', () => {
    service.create(key1, CacheType.Memory, { expiryTime: 5000 });
    const instance1 = service.get(key1);
    const instance2 = service.get('something');
    expect(instance1).toBeTruthy();
    expect(instance2).toBeFalsy();
  });

  it('should remove cache instances', () => {
    const instance = service.create(key1, CacheType.Memory, { expiryTime: 5000 });
    expect(instance).toBeTruthy();
    const result1 = service.remove(key1);
    expect(result1).toBeTrue();
    expect(service.has(key1)).toBeFalse();
    const result2 = service.remove('something');
    expect(result2).toBeFalse();
    expect(service.has('something')).toBeFalse();
  });

  it('should create data loader', fakeAsync(() => {
    const loader = service.createDataLoader<string, string>((params: string) => of(params).pipe(delay(1000)), 'loader-key1', CacheType.Memory);
    expect(loader).toBeTruthy();
    loader.get('abc');
    tick(1100);
    loader.asObservable().pipe(take(1)).subscribe(v => expect(v).toEqual({ status: DataStatus.OK, data: 'abc' }));
  }));
});
