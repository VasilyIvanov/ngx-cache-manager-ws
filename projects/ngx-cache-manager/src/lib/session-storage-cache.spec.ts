import { fakeAsync, tick } from '@angular/core/testing';
import { SessionStorageCache } from './session-storage-cache';

class KeyClass {
  public constructor(public readonly a: string, public readonly b: number, public readonly c: Date) { }
}

interface ValueObject {
  a: string;
  b: number;
  c: boolean;
  d?: ValueObject;
}

describe('SessionStorageCache', () => {
  const storageKey1 = 'TEST_KEY1';
  const storageKey3 = 'TEST_KEY3';

  beforeEach(() => {
    sessionStorage.removeItem(storageKey1);
  });

  afterEach(() => {
    sessionStorage.removeItem(storageKey1);
  });

  it('should write to the storage', () => {
    const lsc1 = new SessionStorageCache<string, string>(storageKey1);
    expect(sessionStorage.getItem(storageKey1)).toBeFalsy();

    lsc1.set('value1', 'key1');
    lsc1.set('value2', 'key2');
    const state1 = sessionStorage.getItem(storageKey1);
    expect(state1).toBeTruthy();

    lsc1.set('value3', 'key3');
    const state2 = sessionStorage.getItem(storageKey1);
    expect(state2).toBeTruthy();
    expect(state2?.length).toBeGreaterThan(state1?.length ?? 0);

    lsc1.set('value3value3', 'key3');
    const state3 = sessionStorage.getItem(storageKey1);
    expect(state3).toBeTruthy();
    expect(state3?.length).toBeGreaterThan(state2?.length ?? 0);

    const result = lsc1.delete('key3');
    const state4 = sessionStorage.getItem(storageKey1);
    expect(result).toBeTrue();
    expect(state4).toBeTruthy();
    expect(state4?.length).toBeLessThan(state3?.length ?? 0);
    expect(state4?.length).toBeLessThan(state2?.length ?? 0);
  });

  it('should pick up values from an existing storage', () => {
    const lsc1 = new SessionStorageCache<string, string>(storageKey1);
    expect(sessionStorage.getItem(storageKey1)).toBeFalsy();

    lsc1.set('value1', 'key1');
    lsc1.set('value2', 'key2');
    const state1 = sessionStorage.getItem(storageKey1);
    expect(state1).toBeTruthy();

    const lsc2 = new SessionStorageCache<string, string>(storageKey1); // Attach
    expect(lsc2.has('key1')).toBe(lsc1.has('key1'));
    expect(lsc2.has('key2')).toBe(lsc1.has('key2'));
    expect(lsc2.has('key3')).toBe(lsc1.has('key3'));
    expect(lsc2.get('key1')).toBe(lsc1.get('key1'));
    expect(lsc2.get('key2')).toBe(lsc1.get('key2'));
    expect(lsc2.get('key3')).toBe(lsc1.get('key3'));
  });

  it('should expire', fakeAsync(() => {
    const lsc3 = new SessionStorageCache<KeyClass, ValueObject>(storageKey3, { maxLength: 5, expiryTime: 1000 });

    const classObject1 = new KeyClass('value1', 111, new Date());
    const classObject2 = new KeyClass('value2', 222, new Date(Date.now() + 1000 * 20));
    const classObject3 = new KeyClass('value3', 333, new Date(Date.now() + 1000 * 30));
    const classObject4 = new KeyClass('value4', 444, new Date(Date.now() + 1000 * 50));
    const classObject5 = new KeyClass('value5', 555, new Date(Date.now() + 1000 * 80));
    const classObject6 = new KeyClass('additional', 0, new Date(Date.now() + 1000 * 99));

    const valueObject1 = { a: 'aaa', b: 1, c: true };
    const valueObject2 = { a: 'bbb', b: 2, c: false };
    const valueObject3 = { a: 'ccc', b: 3, c: true };
    const valueObject4 = { a: 'ddd', b: 4, c: false };
    const valueObject5 = { a: 'eee', b: 5, c: true };
    const valueObject6 = { a: 'additional', b: 6, c: true };

    expect(sessionStorage.getItem(storageKey3)).toBeFalsy();
    lsc3.set(valueObject1, classObject1);
    lsc3.set(valueObject2, classObject2);
    lsc3.set(valueObject3, classObject3);
    lsc3.set(valueObject4, classObject4);
    lsc3.set(valueObject5, classObject5);
    expect(sessionStorage.getItem(storageKey3)).toBeTruthy();

    tick(500);
    expect(lsc3.getLength()).toBe(5);
    lsc3.set(valueObject6, classObject1); // Existing one, will expire at 500 + 1000 = 1500.
    lsc3.set(valueObject6, classObject6); // New one but max length is 5, will expire at 500 + 1000 = 1500.
    expect(lsc3.getLength()).toBe(5);
    expect(sessionStorage.getItem(storageKey3)).toBeTruthy();

    tick(750); // Overall 1250.
    expect(lsc3.getLength()).toBe(2);
    expect(sessionStorage.getItem(storageKey3)).toBeTruthy();

    tick(500); // Overall 1750.
    expect(lsc3.getLength()).toBe(0);
    expect(sessionStorage.getItem(storageKey3)).toBeFalsy();
  }));
});
