import { fakeAsync, TestBed, tick } from "@angular/core/testing";
import { delay, Observable, of } from "rxjs";
import { cache, CachedValueType } from "./cache-decorator";
import { NgxCacheManagerModule } from "./ngx-cache-manager.module";
import { CacheService } from "./services/cache.service";

describe('@cache()', () => {
  let service: CacheService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [NgxCacheManagerModule]
    })

    service = TestBed.inject(CacheService);
  });

  it('should create cache and save values', () => {
    const test1 = new CacheDecoratorTest();
    test1.testMethod1('xxx', 666, false);
    test1.testMethod1('yyy', 777, true);
    expect(service.has('CacheDecoratorTest.testMethod1')).toBeTrue();

    const cache = service.get('CacheDecoratorTest.testMethod1');
    expect(cache?.getLength()).toBe(2);
    expect(cache?.has(['xxx', 666, false])).toBeTrue();
    expect(cache?.has(['yyy', 777, true])).toBeTrue();
    expect(cache?.has(['yyy', 777, false])).toBeFalse();

    expect(cache?.get(['xxx', 666, false])).toEqual({ value: JSON.stringify({ a: 'xxx', b: 666, c: false }), valueType: CachedValueType.Normal });
    expect(cache?.get(['yyy', 777, true])).toEqual({ value: JSON.stringify({ a: 'yyy', b: 777, c: true }), valueType: CachedValueType.Normal });
  });

  it('should work with methods without arguments', () => {
    const test1 = new CacheDecoratorTest();
    test1.testMethod2();
    expect(service.has('CacheDecoratorTest.testMethod2')).toBeTrue();

    const cache = service.get('CacheDecoratorTest.testMethod2');
    expect(cache?.getLength()).toBe(1);
    expect(cache?.has([])).toBeTrue();

    expect(cache?.get([])).toEqual({ value: 'response', valueType: CachedValueType.Normal });
  });

  it('should work with Promise', fakeAsync(() => {
    const test1 = new CacheDecoratorTest();
    let result = 0;
    test1.testWithPromise(1000).then(value => result = value);
    const cache = service.get('CacheDecoratorTest.testWithPromise');
    expect(result).toBe(0);
    expect(cache?.has([1000])).toBeFalse();

    tick(1500);
    expect(result).toBe(1000);
    expect(cache?.has([1000])).toBeTrue();
    expect(cache?.get([1000])).toEqual({ value: 1000, valueType: CachedValueType.Promise });

    result = 0;
    test1.testWithPromise(1000).then(value => result = value); // Now it should be delivered from cache soon but not synchronously.
    tick(100);
    expect(result).toBe(1000);

    cache?.set({ value: 999, valueType: CachedValueType.Promise }, [1000]); // Change the cache value and make sure we'll get it.
    result = 0;
    test1.testWithPromise(1000).then(value => result = value); // Now it should also be delivered from cache soon but not synchronously.
    tick(100);
    expect(result).toBe(999);
  }));

  it('should work with Observable', fakeAsync(() => {
    const test1 = new CacheDecoratorTest();
    let result = 0;
    test1.testWIthObservable(1000).subscribe(value => result = value);
    const cache = service.get('CacheDecoratorTest.testWIthObservable');
    expect(result).toBe(0);
    expect(cache?.has([1000])).toBeFalse();

    tick(1500);
    expect(result).toBe(1000);
    expect(cache?.has([1000])).toBeTrue();
    expect(cache?.get([1000])).toEqual({ value: 1000, valueType: CachedValueType.Observable });

    result = 0;
    test1.testWIthObservable(1000).subscribe(value => result = value); // Now it should be delivered from cache synchronously by of().
    expect(result).toBe(1000);

    cache?.set({ value: 999, valueType: CachedValueType.Observable }, [1000]); // Change the cache value and make sure we'll get it.
    result = 0;
    test1.testWIthObservable(1000).subscribe(value => result = value); // Now it should also be delivered from cache synchronously by of().
    expect(result).toBe(999);
  }));

  it('should create cache and save values with a static method', () => {
    CacheDecoratorTest.staticTestMethod('xxx', 666, false);
    CacheDecoratorTest.staticTestMethod('yyy', 777, true);
    expect(service.has('CacheDecoratorTest.staticTestMethod')).toBeTrue();

    const cache = service.get('CacheDecoratorTest.staticTestMethod');
    expect(cache?.has(['xxx', 666, false])).toBeTrue();
    expect(cache?.has(['yyy', 777, true])).toBeTrue();
    expect(cache?.has(['yyy', 777, false])).toBeFalse();

    expect(cache?.get(['xxx', 666, false])).toEqual({ value: JSON.stringify(['xxx', 666, false]), valueType: CachedValueType.Normal });
    expect(cache?.get(['yyy', 777, true])).toEqual({ value: JSON.stringify(['yyy', 777, true]), valueType: CachedValueType.Normal });
  });
});

class CacheDecoratorTest {
  @cache()
  public testMethod1(a: string, b: number, c: boolean): string {
    return JSON.stringify({ a, b, c });
  }

  @cache()
  public testMethod2(): string {
    return 'response';
  }

  @cache()
  public testWithPromise(param: number): Promise<number> {
    return new Promise(resolve => setTimeout(() => resolve(param), param));
  }

  @cache()
  public testWIthObservable(param: number): Observable<number> {
    return of(param).pipe(delay(param));
  }

  @cache()
  public static staticTestMethod(d: string, e: number, f: boolean): string {
    return JSON.stringify([d, e, f]);
  }
}
