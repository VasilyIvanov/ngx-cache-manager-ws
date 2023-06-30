import { fakeAsync, tick } from '@angular/core/testing';
import { CacheOptions } from './abstract-cache';
import { CacheCustomizer } from './cache-customizer';
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

interface ListParams {
  from: Date;
  till: Date;
}

interface ListItem {
  date: Date;
  num: number;
}

class Customizer1 extends CacheCustomizer<ListParams, Array<ListItem>> {
  public override compare(cachedParams: ListParams, requestParams: ListParams): boolean {
    return requestParams.from.getTime() >= cachedParams.from.getTime() && requestParams.till.getTime() <= cachedParams.till.getTime();
  }

  public override postProcessData(data: Array<ListItem>, originalParams: ListParams): Array<ListItem> {
    return data.filter(d => d.date.getTime() >= originalParams.from.getTime() && d.date.getTime() <= originalParams.till.getTime());
  }
}

describe('MemoryCache', () => {
  let mc1: MemoryCache<string, string>;
  let mc2: MemoryCache<KeyObject, string>;
  let mc3: MemoryCache<KeyClass, ValueObject>;
  let mc4: MemoryCache<string, ValueObject>;
  let mc5: MemoryCache<ListParams, Array<ListItem>>;
  let mc6: MemoryCache<ListParams, Array<ListItem>>;
  let mc7: MemoryCache<void, string>;

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

  const listParams1: ListParams = {
    from: new Date('2023-01-01'),
    till: new Date('2023-01-08')
  }

  const listParams2: ListParams = {
    from: new Date('2023-02-01'),
    till: new Date('2023-02-08')
  }

  const listParams3: ListParams = {
    from: new Date('2023-03-01'),
    till: new Date('2023-03-08')
  }

  const list1FilterParams1: ListParams = {
    from: new Date('2023-01-03'),
    till: new Date('2023-01-08')
  }

  const list1FilterParams2: ListParams = {
    from: new Date('2023-01-01'),
    till: new Date('2023-01-04')
  }

  const list1FilterParams3: ListParams = {
    from: new Date('2023-01-01'),
    till: new Date('2023-01-09')
  }

  const list2FilterParams1: ListParams = {
    from: new Date('2023-02-03'),
    till: new Date('2023-02-07')
  }

  const list2FilterParams2: ListParams = {
    from: new Date('2023-02-01'),
    till: new Date('2023-02-04')
  }

  const list2FilterParams3: ListParams = {
    from: new Date('2023-01-01'),
    till: new Date('2023-01-08')
  }

  const list1: Array<ListItem> = [
    {
      date: new Date('2023-01-01'),
      num: 0
    },
    {
      date: new Date('2023-01-02'),
      num: 1
    },
    {
      date: new Date('2023-01-03'),
      num: 2
    },
    {
      date: new Date('2023-01-04'),
      num: 3
    },
    {
      date: new Date('2023-01-05'),
      num: 4
    },
    {
      date: new Date('2023-01-06'),
      num: 5
    },
    {
      date: new Date('2023-01-07'),
      num: 6
    },
    {
      date: new Date('2023-01-08'),
      num: 7
    },
  ];

  const list2: Array<ListItem> = [
    {
      date: new Date('2023-02-01'),
      num: 10
    },
    {
      date: new Date('2023-02-02'),
      num: 11
    },
    {
      date: new Date('2023-02-03'),
      num: 12
    },
    {
      date: new Date('2023-02-04'),
      num: 13
    },
    {
      date: new Date('2023-02-05'),
      num: 14
    },
    {
      date: new Date('2023-02-06'),
      num: 15
    },
    {
      date: new Date('2023-02-07'),
      num: 16
    },
    {
      date: new Date('2023-02-08'),
      num: 17
    },
  ];

  beforeEach(() => {
    mc1 = new MemoryCache<string, string>();
    mc1.set('value1', 'key1');
    mc1.set('value2', 'key2');

    mc2 = new MemoryCache<KeyObject, string>({ expiryTime: 1000, options: CacheOptions.CloneKey });
    mc2.set('value1', keyObject1);
    mc2.set('value2', keyObject2);
    mc2.set('value3', keyObject3);
    mc2.set('value4', keyObject4);
    mc2.set('value5', keyObject5);

    mc3 = new MemoryCache<KeyClass, ValueObject>({ maxLength: 5, options: CacheOptions.CloneValue });
    mc3.set(valueObject1, classObject1);
    mc3.set(valueObject2, classObject2);
    mc3.set(valueObject3, classObject3);
    mc3.set(valueObject4, classObject4);
    mc3.set(valueObject5, classObject5);

    mc4 = new MemoryCache<string, ValueObject>({ expiryTime: 1500, maxLength: 5, options: CacheOptions.CloneKey | CacheOptions.CloneValue });
    mc4.set(valueObject1, 'key1');
    mc4.set(valueObject2, 'key2');
    mc4.set(valueObject3, 'key3');
    mc4.set(valueObject4, 'key4');
    mc4.set(valueObject5, 'key5');

    mc5 = new MemoryCache<ListParams, Array<ListItem>>({ customizer: new Customizer1(), options: CacheOptions.ThrowIfExists });
    mc5.set(list1, listParams1);
    mc5.set(list2, listParams2);

    mc6 = new MemoryCache<ListParams, Array<ListItem>>({ customizer: new Customizer1(), options: CacheOptions.ExactMatch });
    mc6.set(list1, listParams1);
    mc6.set(list2, listParams2);

    mc7 = new MemoryCache<void, string>();
    mc7.set('abc');
  });

  it('should expire', fakeAsync(() => {
    tick(1250);
    expect(mc1.getLength()).toBe(2);
    expect(mc2.has(Utils.clone(keyObject1))).toBeFalse();
    expect(mc2.getLength()).toBe(0);
    expect(mc3.getLength()).toBe(5);
    expect(mc4.getLength()).toBe(5);
    mc2.set('value1', keyObject1); // Will expire at 1250 + 1000 = 2250.
    mc4.set(valueObject4, 'key4'); // Will expire at 1250 + 1500 = 2750.

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
    expect(mc5.getLength()).toBe(2);

    mc1.set('value3', 'key3');
    mc2.set('value6', keyObject6);
    mc3.set(valueObject6, classObject6);
    mc4.set(valueObject6, 'key6');
    expect(mc1.getLength()).toBe(3); // Unlimited.
    expect(mc2.getLength()).toBe(6); // Unlimited.
    expect(mc3.getLength()).toBe(5); // Limited to 5.
    expect(mc4.getLength()).toBe(5); // Limited to 5.
  });

  it('should perform forEach', () => {
    mc4.forEach((v, i) => expect(v.key).toBe(`key${5 - i}`));

    mc4.set(valueObject3, 'key3'); // key3 should go to the top now
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

    // Not exact match
    expect(mc5.has(listParams1)).toBeTrue();
    expect(mc5.has(listParams2)).toBeTrue();
    expect(mc5.has(list1FilterParams1)).toBeTrue();
    expect(mc5.has(list1FilterParams2)).toBeTrue();
    expect(mc5.has(list1FilterParams3)).toBeFalse();
    expect(mc5.has(list2FilterParams1)).toBeTrue();
    expect(mc5.has(list2FilterParams2)).toBeTrue();
    expect(mc5.has(list2FilterParams3)).toBeTrue();

    // Exact match
    expect(mc6.has(listParams1)).toBeTrue();
    expect(mc6.has(listParams2)).toBeTrue();
    expect(mc6.has(list1FilterParams1)).toBeFalse();
    expect(mc6.has(list1FilterParams2)).toBeFalse();
    expect(mc6.has(list1FilterParams3)).toBeFalse();
    expect(mc6.has(list2FilterParams1)).toBeFalse();
    expect(mc6.has(list2FilterParams2)).toBeFalse();
    expect(mc6.has(list2FilterParams3)).toBeTrue();

    expect(mc7.has()).toBeTrue();
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

    // Not exact match
    expect(mc5.get(listParams1)).toEqual(list1);
    expect(mc5.get(listParams2)).toEqual(list2);
    expect(mc5.get(list1FilterParams1)).toEqual(list1.filter(x => x.date >= list1FilterParams1.from && x.date <= list1FilterParams1.till));
    expect(mc5.get(list1FilterParams2)).toEqual(list1.filter(x => x.date >= list1FilterParams2.from && x.date <= list1FilterParams2.till));
    expect(mc5.get(list1FilterParams3)).toBeUndefined();
    expect(mc5.get(list2FilterParams1)).toEqual(list2.filter(x => x.date >= list2FilterParams1.from && x.date <= list2FilterParams1.till));
    expect(mc5.get(list2FilterParams2)).toEqual(list2.filter(x => x.date >= list2FilterParams2.from && x.date <= list2FilterParams2.till));
    expect(mc5.get(list2FilterParams3)).toEqual(list1);

    // Exact match
    expect(mc6.get(listParams1)).toEqual(list1);
    expect(mc6.get(listParams2)).toEqual(list2);
    expect(mc6.get(list1FilterParams1)).toBeUndefined();
    expect(mc6.get(list1FilterParams2)).toBeUndefined();
    expect(mc6.get(list1FilterParams3)).toBeUndefined();
    expect(mc6.get(list2FilterParams1)).toBeUndefined();
    expect(mc6.get(list2FilterParams2)).toBeUndefined();
    expect(mc6.get(list2FilterParams3)).toEqual(list1);

    expect(mc7.get()).toBe('abc');
  });

  it('should set', () => {
    mc1.set('value1', 'key1');
    mc1.set('value2', 'key2');
    mc1.set('value3', 'key3');
    expect(mc1.get('key1')).toBe('value1');
    expect(mc1.get('key2')).toBe('value2');
    expect(mc1.get('key3')).toBe('value3');

    mc2.set('value6', keyObject6);
    expect(mc2.get(keyObject6)).toBe('value6');
    expect(mc2.get(Utils.clone(keyObject6))).toBe('value6');

    mc3.set(valueObject6, classObject6);
    expect(mc3.get(classObject6)).not.toBe(valueObject6);
    expect(mc3.get(classObject6)).toEqual(valueObject6);
    expect(mc3.get(Utils.clone(classObject6))).not.toBe(valueObject6);
    expect(mc3.get(Utils.clone(classObject6))).toEqual(valueObject6);
    expect(mc3.get(classObject6)).not.toBe(Utils.clone(valueObject6));
    expect(mc3.get(classObject6)).toEqual(Utils.clone(valueObject6));

    // Not added a new one because of non-exact match.
    // Thrown because of ThrowIfExists.
    expect(() => mc5.set(list1.filter(x => x.date >= list1FilterParams1.from && x.date <= list1FilterParams1.till), list1FilterParams1))
      .toThrowError(`Key ${JSON.stringify(list1FilterParams1)} already exists.`);
    expect(mc5.getLength()).toBe(2);

    mc6.set(list1.filter(x => x.date >= list1FilterParams2.from && x.date <= list1FilterParams2.till), list1FilterParams2);
    expect(mc6.getLength()).toBe(3); // Added a new one because of exact match

    mc7.set('def');
    expect(mc7.get()).toBe('def');
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

    const res5 = mc5.delete(list1FilterParams2);
    expect(res5).toBeTrue(); // Deleted because of non-exact match, this key is a subset of key #1.
    expect(mc5.getLength()).toBe(1);
    const res3 = mc6.delete(list1FilterParams1);
    expect(res3).toBeFalse(); // Not deleted because of exact match, this key doesn't exist
    expect(mc6.getLength()).toBe(2);
    const res4 = mc6.delete(list1FilterParams2);
    expect(res4).toBeFalse(); // Deleted because of non-exact match, this key is a subset of key #1.
    expect(mc6.getLength()).toBe(2);

    const res7 = mc7.delete();
    expect(res7).toBeTrue();
    expect(mc7.getLength()).toBe(0);
  });

  it('should clear', () => {
    mc2.clear();
    expect(mc2.getLength()).toBe(0);
    expect(mc2.has(keyObject3)).toBeFalse();
    expect(mc2.has(Utils.clone(keyObject3))).toBeFalse();
    expect(mc2.has(keyObject4)).toBeFalse();
    expect(mc2.has(Utils.clone(keyObject4))).toBeFalse();

    mc6.clear();
    expect(mc6.getLength()).toBe(0);
  });
});
