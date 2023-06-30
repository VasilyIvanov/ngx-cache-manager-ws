import { fakeAsync, tick } from '@angular/core/testing';
import { delay, last, Observable, of, take, tap } from 'rxjs';
import { CachedDataLoader, DataState, DataStatus } from './cached-data-loader';
import { MemoryCache } from './memory-cache';

describe('CachedDataLoader', () => {
  let mc1: MemoryCache<string, string>;
  let l1: CachedDataLoader<string, string>;

  const physicalLoader1 = (params: string): Observable<string> => {
    return of(params).pipe(delay(1000));
  }

  const physicalLoader2 = (params: string): Observable<string> => {
    return of(params).pipe(delay(1000), tap(() => { throw testError; }));
  }

  const physicalLoader3 = (params: string): Promise<string> => {
    return new Promise(resolve => setTimeout(() => resolve(params), 1000));
  }

  const physicalLoader4 = (params: string): Promise<string> => {
    return new Promise(resolve => setTimeout(() => resolve(params), 1000)).then(() => { throw testError; });
  }

  const testError = new Error('Test error');

  it('should get results with subscribe()', fakeAsync(() => {
    mc1 = new MemoryCache<string, string>();
    l1 = new CachedDataLoader<string, string>(mc1, physicalLoader1);

    const results1 = new Array<DataState<string>>();
    l1.subscribe(v => results1.push(v));
    l1.get('abc');

    tick(1100);

    expect(results1[0]).toEqual({ status: DataStatus.Inactive });
    expect(results1[1]).toEqual({ status: DataStatus.Loading });
    expect(results1[2]).toEqual({ status: DataStatus.OK, data: 'abc' });
  }));

  it('should get results with asObservable()', fakeAsync(() => {
    mc1 = new MemoryCache<string, string>();
    l1 = new CachedDataLoader<string, string>(mc1, physicalLoader1);

    l1.asObservable().pipe(take(1)).subscribe(v => expect(v).toEqual({ status: DataStatus.Inactive }));
    l1.get('abc');
    l1.asObservable().pipe(take(1)).subscribe(v => expect(v).toEqual({ status: DataStatus.Loading }));
    tick(1100);
    l1.asObservable().pipe(take(1)).subscribe(v => expect(v).toEqual({ status: DataStatus.OK, data: 'abc' }));

    l1.get('def');
    tick(1100);
    l1.asObservable().pipe(take(1)).subscribe(v => expect(v).toEqual({ status: DataStatus.OK, data: 'def' }));

    // No delay now because the data should come from cache without the physical loader
    l1.get('abc');
    l1.asObservable().pipe(last()).subscribe(v => expect(v).toEqual({ status: DataStatus.OK, data: 'abc' }));
    l1.get('def');
    l1.asObservable().pipe(last()).subscribe(v => expect(v).toEqual({ status: DataStatus.OK, data: 'def' }));
  }));

  it('should get results with asDataObservable()', fakeAsync(() => {
    mc1 = new MemoryCache<string, string>();
    l1 = new CachedDataLoader<string, string>(mc1, physicalLoader1);

    l1.asDataObservable().pipe(take(1)).subscribe(v => expect(v).toBeUndefined());
    l1.get('abc');
    l1.asDataObservable().pipe(take(1)).subscribe(v => expect(v).toBeUndefined());
    tick(1100);
    l1.asDataObservable().pipe(take(1)).subscribe(v => expect(v).toBe('abc'));
  }));

  it('should get results with asLoadingObservable()', fakeAsync(() => {
    mc1 = new MemoryCache<string, string>();
    l1 = new CachedDataLoader<string, string>(mc1, physicalLoader1);

    l1.asLoadingObservable().pipe(take(1)).subscribe(v => expect(v).toBeFalse());
    l1.get('abc');
    l1.asLoadingObservable().pipe(take(1)).subscribe(v => expect(v).toBeTrue());
    tick(1100);
    l1.asLoadingObservable().pipe(take(1)).subscribe(v => expect(v).toBeFalse());
  }));

  it('should get results with asStatusObservable()', fakeAsync(() => {
    mc1 = new MemoryCache<string, string>();
    l1 = new CachedDataLoader<string, string>(mc1, physicalLoader1);

    l1.asStatusObservable().pipe(take(1)).subscribe(v => expect(v).toBe(DataStatus.Inactive));
    l1.get('abc');
    l1.asStatusObservable().pipe(take(1)).subscribe(v => expect(v).toBe(DataStatus.Loading));
    tick(1100);
    l1.asStatusObservable().pipe(take(1)).subscribe(v => expect(v).toBe(DataStatus.OK));
  }));

  it('should cancel()', fakeAsync(() => {
    mc1 = new MemoryCache<string, string>();
    l1 = new CachedDataLoader<string, string>(mc1, physicalLoader1);

    l1.asObservable().pipe(take(1)).subscribe(v => expect(v).toEqual({ status: DataStatus.Inactive }));
    l1.get('abc');
    l1.asObservable().pipe(take(1)).subscribe(v => expect(v).toEqual({ status: DataStatus.Loading }));
    tick(500);
    l1.cancel();
    l1.asObservable().pipe(take(1)).subscribe(v => expect(v).toEqual({ status: DataStatus.Inactive }));
  }));

  it('should return error', fakeAsync(() => {
    mc1 = new MemoryCache<string, string>();
    l1 = new CachedDataLoader<string, string>(mc1, physicalLoader2);

    l1.asObservable().pipe(take(1)).subscribe(v => expect(v).toEqual({ status: DataStatus.Inactive }));
    l1.get('abc');
    l1.asObservable().pipe(take(1)).subscribe(v => expect(v).toEqual({ status: DataStatus.Loading }));
    tick(1100);
    l1.asObservable().pipe(take(1)).subscribe(v => expect(v).toEqual({ status: DataStatus.Error, error: testError }));
  }));

  it('should get results from a promise-based physical loader with asObservable()', fakeAsync(() => {
    mc1 = new MemoryCache<string, string>();
    l1 = new CachedDataLoader<string, string>(mc1, physicalLoader3);

    l1.asObservable().pipe(take(1)).subscribe(v => expect(v).toEqual({ status: DataStatus.Inactive }));
    l1.get('abc');
    l1.asObservable().pipe(take(1)).subscribe(v => expect(v).toEqual({ status: DataStatus.Loading }));
    tick(1100);
    l1.asObservable().pipe(take(1)).subscribe(v => expect(v).toEqual({ status: DataStatus.OK, data: 'abc' }));
  }));

  it('should cancel() with a promise-based physical loader', fakeAsync(() => {
    mc1 = new MemoryCache<string, string>();
    l1 = new CachedDataLoader<string, string>(mc1, physicalLoader3);

    l1.asObservable().pipe(take(1)).subscribe(v => expect(v).toEqual({ status: DataStatus.Inactive }));
    l1.get('abc');
    l1.asObservable().pipe(take(1)).subscribe(v => expect(v).toEqual({ status: DataStatus.Loading }));
    tick(500);
    l1.cancel();
    l1.asObservable().pipe(take(1)).subscribe(v => expect(v).toEqual({ status: DataStatus.Inactive }));
    tick(600); // We cannot actually cancel the promise
  }));

  it('should return error with a promise-based physical loader', fakeAsync(() => {
    mc1 = new MemoryCache<string, string>();
    l1 = new CachedDataLoader<string, string>(mc1, physicalLoader4);

    l1.asObservable().pipe(take(1)).subscribe(v => expect(v).toEqual({ status: DataStatus.Inactive }));
    l1.get('abc');
    l1.asObservable().pipe(take(1)).subscribe(v => expect(v).toEqual({ status: DataStatus.Loading }));
    tick(1100);
    l1.asObservable().pipe(take(1)).subscribe(v => expect(v).toEqual({ status: DataStatus.Error, error: testError }));
  }));
});
