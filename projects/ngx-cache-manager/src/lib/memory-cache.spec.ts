import { fakeAsync, tick } from '@angular/core/testing';
import { CacheSetOptions } from './abstract-cache';
import { MemoryCache } from './memory-cache';
import { Utils } from './utils';

interface KeyObject {
  a: string;
  b: number;
  c: boolean;
  d?: KeyObject;
}

class KeyClass {
  public constructor(public readonly a: string, public readonly b: number, public readonly c: Date) { }
}

interface ValueObject {
  a: string;
  b: number;
  c: boolean;
  d?: ValueObject;
}

describe('MemoryCache', () => {
  let mc1: MemoryCache<string, string>;
  let mc2: MemoryCache<KeyObject, string>;
  let mc3: MemoryCache<KeyClass, ValueObject>;
  let mc4: MemoryCache<string, ValueObject>;

  const keyObject1: KeyObject = { a: 'xxx', b: 666, c: true };
  const keyObject2: KeyObject = { a: 'yyy', b: 777, c: false };
  const keyObject3: KeyObject = { ...keyObject1, d: keyObject2 };
  const keyObject4: KeyObject = { a: 'zzz', b: 888, c: true };
  const keyObject5: KeyObject = { a: 'aaa', b: 999, c: false };
  const keyObject6: KeyObject = { a: 'additional', b: 0, c: false };

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

  beforeEach(() => {
    mc1 = new MemoryCache<string, string>();
    mc1.set('key1', 'value1');
    mc1.set('key2', 'value2', CacheSetOptions.None);

    mc2 = new MemoryCache<KeyObject, string>({ expiryTime: 1000 });
    mc2.set(keyObject1, 'value1', CacheSetOptions.CloneKey);
    mc2.set(keyObject2, 'value2', CacheSetOptions.CloneValue);
    mc2.set(keyObject3, 'value3', CacheSetOptions.CloneKey | CacheSetOptions.CloneValue);
    mc2.set(keyObject4, 'value4');
    mc2.set(keyObject5, 'value5', CacheSetOptions.None);

    mc3 = new MemoryCache<KeyClass, ValueObject>({ maxLength: 5 });
    mc3.set(classObject1, valueObject1, CacheSetOptions.CloneKey);
    mc3.set(classObject2, valueObject2, CacheSetOptions.CloneValue);
    mc3.set(classObject3, valueObject3, CacheSetOptions.CloneKey | CacheSetOptions.CloneValue);
    mc3.set(classObject4, valueObject4);
    mc3.set(classObject5, valueObject5, CacheSetOptions.None);

    mc4 = new MemoryCache<string, ValueObject>({ expiryTime: 1500, maxLength: 5 });
    mc4.set('key1', valueObject1, CacheSetOptions.CloneKey);
    mc4.set('key2', valueObject2, CacheSetOptions.CloneValue);
    mc4.set('key3', valueObject3, CacheSetOptions.CloneKey | CacheSetOptions.CloneValue);
    mc4.set('key4', valueObject4);
    mc4.set('key5', valueObject5, CacheSetOptions.None);
  });

  it('should expire', fakeAsync(() => {
    tick(1250);
    expect(mc1.getLength()).toBe(2);
    expect(mc2.has(Utils.clone(keyObject1))).toBeFalse();
    expect(mc2.getLength()).toBe(0);
    expect(mc3.getLength()).toBe(5);
    expect(mc4.getLength()).toBe(5);
    mc2.set(keyObject1, 'value1', CacheSetOptions.CloneKey); // Will expire at 1250 + 1000 = 2250.
    mc4.set('key4', valueObject4); // Will expire at 1250 + 1500 = 2750.

    tick(500); // Overall 1750.
    expect(mc1.getLength()).toBe(2);
    expect(mc2.has(Utils.clone(keyObject1))).toBeTrue(); // Will expire at 1250 + 1000 = 2250.
    expect(mc2.getLength()).toBe(1);
    expect(mc4.has('key4')).toBeTrue(); // Will expire at 1250 + 1500 = 2750.
    expect(mc3.getLength()).toBe(5);
    expect(mc4.getLength()).toBe(1);

    tick(1000); // Overall 2750.
    expect(mc1.getLength()).toBe(2);
    expect(mc2.has(Utils.clone(keyObject1))).toBeFalse(); // Expired at 1250 + 1000 = 2250.
    expect(mc2.getLength()).toBe(0);
    expect(mc3.getLength()).toBe(5);
    expect(mc4.getLength()).toBe(0);

    tick(250); //Overall 3000.
    expect(mc2.getLength()).toBe(0);
    expect(mc4.has('key4')).toBeFalse(); // Expired at 1250 + 1500 = 2750.
  }));

  it('should have correct length', () => {
    expect(mc1.getLength()).toBe(2);
    expect(mc2.getLength()).toBe(5);
    expect(mc3.getLength()).toBe(5);
    expect(mc4.getLength()).toBe(5);

    mc1.set('key3', 'value3');
    mc2.set(keyObject6, 'value6');
    mc3.set(classObject6, valueObject6);
    mc4.set('key6', valueObject6);
    expect(mc1.getLength()).toBe(3); // Unlimited.
    expect(mc2.getLength()).toBe(6); // Unlimited.
    expect(mc3.getLength()).toBe(5); // Limited to 5.
    expect(mc4.getLength()).toBe(5); // Limited to 5.
  });

  it('should perform forEach', () => {
    mc4.forEach((v, i) => expect(v.key).toBe(`key${5 - i}`));

    mc4.set('key3', valueObject3); // key3 should go to the top now
    mc4.forEach((v, i) => {
      let keyNo = 0;
      switch (i) {
        case 0:
          keyNo = 3;
          break;
        case 1:
          keyNo = 5;
          break;
        case 2:
          keyNo = 4;
          break;
        case 3:
          keyNo = 2;
          break;
        case 4:
          keyNo = 1;
          break;
      }
      expect(v.key).toBe(`key${keyNo}`);
    });
  });

  it('should have added keys', () => {
    expect(mc1.has('key1')).toBeTrue();
    expect(mc1.has('key2')).toBeTrue();
    expect(mc1.has('key3')).toBeFalse();

    expect(mc2.has(Utils.clone(keyObject1))).toBeTrue();
    expect(mc2.has(keyObject2)).toBeTrue();
    expect(mc2.has(Utils.clone(keyObject3))).toBeTrue();
    expect(mc2.has(keyObject4)).toBeTrue();
    expect(mc2.has(Utils.clone(keyObject5))).toBeTrue();
    expect(mc2.has({ ...keyObject4, a: 'wrong' })).toBeFalse();

    expect(mc3.has(classObject1)).toBeTrue();
    expect(mc3.has(Utils.clone(classObject2))).toBeTrue();
    expect(mc3.has(classObject3)).toBeTrue();
    expect(mc3.has(Utils.clone(classObject4))).toBeTrue();
    expect(mc3.has(classObject5)).toBeTrue();
    expect(mc3.has({ ...classObject1, b: -1 })).toBeFalse();

    expect(mc4.has('key1')).toBeTrue();
    expect(mc4.has('key2')).toBeTrue();
    expect(mc4.has('key3')).toBeTrue();
    expect(mc4.has('key4')).toBeTrue();
    expect(mc4.has('key5')).toBeTrue();
    expect(mc4.has('key33')).toBeFalse();
  });

  it('should get', () => {
    expect(mc1.get('key1')).toBe('value1');
    expect(mc1.get('key2')).toBe('value2');
    expect(mc1.get('key3')).toBeUndefined();

    expect(mc2.get(keyObject1)).toBe('value1');
    expect(mc2.get(Utils.clone(keyObject2))).toBe('value2');
    expect(mc2.get(keyObject3)).toBe('value3');
    expect(mc2.get(Utils.clone(keyObject4))).toBe('value4');
    expect(mc2.get(keyObject5)).toBe('value5');
    expect(mc2.get(keyObject6)).toBeUndefined();

    expect(mc3.get(Utils.clone(classObject1))).toEqual(Utils.clone(valueObject1));
    expect(mc3.get(classObject2)).toEqual(valueObject2);
    expect(mc3.get(Utils.clone(classObject3))).toEqual(valueObject3);
    expect(mc3.get(classObject4)).toEqual(Utils.clone(valueObject4));
    expect(mc3.get(classObject5)).toEqual(valueObject5);
    expect(mc3.get(classObject6)).toBeUndefined();

    expect(mc4.get('key1')).toEqual(valueObject1);
    expect(mc4.get('key2')).toEqual(Utils.clone(valueObject2));
    expect(mc4.get('key3')).toEqual(valueObject3);
    expect(mc4.get('key4')).toEqual(Utils.clone(valueObject4));
    expect(mc4.get('key5')).toEqual(valueObject5);
    expect(mc4.get('key6')).toBeUndefined();
  });

  it('should set', () => {
    mc1.set('key3', 'value3');
    expect(mc1.get('key3')).toBe('value3');
    expect(() => mc1.set('key3', 'value33', CacheSetOptions.ThrowIfExists)).toThrowError('Key key3 already exists.');
    expect(() => mc1.set('key4', 'value44', CacheSetOptions.ThrowIfNotExists)).toThrowError('Key key4 doesn\'t exist.');

    mc3.set(classObject6, valueObject6, CacheSetOptions.None);
    expect(mc3.get(classObject6)).toBe(valueObject6);
    expect(mc3.get(Utils.clone(classObject6))).toBe(valueObject6);
    expect(mc3.get(classObject6)).not.toBe(Utils.clone(valueObject6));

    mc3.set(classObject6, valueObject6, CacheSetOptions.CloneKey);
    expect(mc3.get(classObject6)).toBe(valueObject6);
    expect(mc3.get(Utils.clone(classObject6))).toBe(valueObject6);
    expect(mc3.get(classObject6)).not.toBe(Utils.clone(valueObject6));

    mc3.set(classObject6, valueObject6, CacheSetOptions.CloneValue);
    expect(mc3.get(classObject6)).not.toBe(valueObject6);
    expect(mc3.get(classObject6)).toEqual(valueObject6);
    expect(mc3.get(Utils.clone(classObject6))).not.toBe(valueObject6);
    expect(mc3.get(Utils.clone(classObject6))).toEqual(valueObject6);
    expect(mc3.get(classObject6)).not.toBe(Utils.clone(valueObject6));
    expect(mc3.get(classObject6)).toEqual(Utils.clone(valueObject6));
  });

  it('should delete', () => {
    const res1 = mc2.delete(Utils.clone(keyObject3));
    expect(res1).toBeTrue();
    expect(mc2.getLength()).toBe(4);
    expect(mc2.has(keyObject3)).toBeFalse();
    expect(mc2.has(Utils.clone(keyObject3))).toBeFalse();
    expect(mc2.has(keyObject4)).toBeTrue();
    expect(mc2.has(Utils.clone(keyObject4))).toBeTrue();

    const res2 = mc4.delete('key2');
    expect(res2).toBeTrue();
    expect(mc4.getLength()).toBe(4);
    expect(mc4.has('key2')).toBeFalse();
    expect(mc4.has('key3')).toBeTrue();
  });

  it('should clear', () => {
    mc2.clear();
    expect(mc2.getLength()).toBe(0);
    expect(mc2.has(keyObject3)).toBeFalse();
    expect(mc2.has(Utils.clone(keyObject3))).toBeFalse();
    expect(mc2.has(keyObject4)).toBeFalse();
    expect(mc2.has(Utils.clone(keyObject4))).toBeFalse();
  });
});

