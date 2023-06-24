import { fakeAsync, tick } from '@angular/core/testing';
import { Utils } from './utils';

enum TestEnum {
  None = 0,
  Option1 = 1,
  Option2 = 2,
  Option3 = 4,
  Option4 = 8,
  Option5 = 16,
  Option6 = 32
}

describe('Utils', () => {
  describe('clone()', () => {
    const primitive1 = 'abc';
    const primitive2 = 666;
    const primitive3 = 23457623565682374n;
    const primitive4 = true;
    const primitive5 = undefined;
    const primitive6 = Symbol('sym');
    const primitive7 = null;
    const date1 = new Date();
    const array1 = [primitive1, primitive2, primitive3, primitive4, primitive5, primitive6, primitive7];
    const array2 = [...array1, array1];
    const object1 = { primitive1, primitive2, primitive3, primitive4, primitive5, primitive6, primitive7 };
    const object2 = { ...object1, object1 };
    const func1 = (x: number) => x * 2;
    const func2 = (x: number) => x * 3;
    const func3 = (x: number) => x * 2;

    it('should clone variables', () => {
      expect(Utils.clone(primitive1)).toBe(primitive1);
      expect(Utils.clone(primitive2)).toBe(primitive2);
      expect(Utils.clone(primitive3)).toBe(primitive3);
      expect(Utils.clone(primitive4)).toBe(primitive4);
      expect(Utils.clone(primitive5)).toBe(primitive5);
      expect(Utils.clone(primitive6)).toBe(primitive6);
      expect(Utils.clone(primitive7)).toBe(primitive7);

      expect(Utils.clone(date1)).not.toBe(date1);
      expect(Utils.clone(date1)).toEqual(date1);

      expect(Utils.clone(array1)).not.toBe(array1);
      expect(Utils.clone(array1)).toEqual(array1);

      expect(Utils.clone(array2)).not.toBe(array2);
      expect(Utils.clone(array2)).toEqual(array2);

      expect(Utils.clone(object1)).not.toBe(object1);
      expect(Utils.clone(object1)).toEqual(object1);

      expect(Utils.clone(object2)).not.toBe(object2);
      expect(Utils.clone(object2)).toEqual(object2);

      expect(Utils.clone(func1)).toBe(func1);
      expect(Utils.clone(func1)).not.toBe(func2);
      expect(Utils.clone(func1)).not.toBe(func3);
    });
  });

  describe('compare()', () => {
    const primitive1 = 'abc';
    const primitive2 = 666;
    const primitive3 = 23457623565682374n;
    const primitive4 = true;
    const primitive5 = undefined;
    const primitive6 = Symbol('sym');
    const primitive7 = null;
    const date1 = new Date();
    const array1 = [primitive1, primitive2, primitive3, primitive4, primitive5, primitive6, primitive7];
    const array2 = [...array1, array1];
    const object1 = { primitive1, primitive2, primitive3, primitive4, primitive5, primitive6, primitive7 };
    const object2 = { ...object1, object1 };
    const func1 = (x: number) => x * 2;
    const func2 = (x: number) => x * 3;
    const func3 = (x: number) => x * 2;

    const anotherPrimitive1 = primitive1;
    const anotherPrimitive2 = primitive2;
    const anotherPrimitive3 = primitive3;
    const anotherPrimitive4 = primitive4;
    const anotherPrimitive5 = primitive5;
    const anotherPrimitive6 = primitive6;
    const anotherPrimitive7 = primitive7;
    const anotherDate = new Date(date1);
    const date2 = new Date(date1);
    date2.setHours(date1.getHours() + 1);
    const anotherArray1 = Utils.clone(array1);
    const anotherArray2 = Utils.clone(array2);
    const anotherObject1 = Utils.clone(object1);
    const anotherObject2 = Utils.clone(object2);

    const compareOrderArray1 = [1, 2, 3];
    const compareOrderArray2 = [1, 3, 2];

    const compareOrderObject1 = {
      a: 1,
      b: 'abc',
      c: true
    };

    const compareOrderObject2 = {
      a: 1,
      c: true,
      b: 'abc'
    };

    const anotherFunc1 = func1;

    it('should compare variables', () => {
      expect(Utils.compare(primitive1, anotherPrimitive1)).toBeTrue();
      expect(Utils.compare(primitive2, anotherPrimitive2)).toBeTrue();
      expect(Utils.compare(primitive3, anotherPrimitive3)).toBeTrue();
      expect(Utils.compare(primitive4, anotherPrimitive4)).toBeTrue();
      expect(Utils.compare(primitive5, anotherPrimitive5)).toBeTrue();
      expect(Utils.compare(primitive6, anotherPrimitive6)).toBeTrue();
      expect(Utils.compare(primitive7, anotherPrimitive7)).toBeTrue();

      expect(Utils.compare(primitive1, anotherPrimitive2 as any)).toBeFalse();
      expect(Utils.compare(primitive2, anotherPrimitive3 as any)).toBeFalse();
      expect(Utils.compare(primitive3, anotherPrimitive4 as any)).toBeFalse();
      expect(Utils.compare(primitive4, anotherPrimitive5 as any)).toBeFalse();
      expect(Utils.compare(primitive5, anotherPrimitive6 as any)).toBeFalse();
      expect(Utils.compare(primitive6, anotherPrimitive7 as any)).toBeFalse();
      expect(Utils.compare(primitive7, anotherPrimitive1 as any)).toBeFalse();

      expect(Utils.compare('', '')).toBeTrue();
      expect(Utils.compare('', 'xxx')).toBeFalse();
      expect(Utils.compare('xxx', '')).toBeFalse();
      expect(Utils.compare('', 0 as any)).toBeFalse();
      expect(Utils.compare('', 0n as any)).toBeFalse();
      expect(Utils.compare('', false as any)).toBeFalse();
      expect(Utils.compare(0, 0n as any)).toBeFalse();
      expect(Utils.compare(0, false as any)).toBeFalse();
      expect(Utils.compare(0n, false as any)).toBeFalse();

      expect(Utils.compare(date1, anotherDate)).toBeTrue();
      expect(Utils.compare(date1, date2)).toBeFalse();

      expect(Utils.compare(array1, anotherArray1)).toBeTrue();
      expect(Utils.compare(array1, array2)).toBeFalse();

      expect(Utils.compare(array2, anotherArray2)).toBeTrue();
      expect(Utils.compare(array2, array1)).toBeFalse();

      expect(Utils.compare(object1, anotherObject1)).toBeTrue();
      expect(Utils.compare(object1, object2)).toBeFalse();

      expect(Utils.compare(object2, anotherObject2)).toBeTrue();
      expect(Utils.compare(object2, object1)).toBeFalse();

      expect(Utils.compare(compareOrderArray1, compareOrderArray2)).toBeFalse();

      expect(Utils.compare(compareOrderObject1, compareOrderObject2)).toBeTrue();

      expect(Utils.compare(func1, anotherFunc1)).toBeTrue();
      expect(Utils.compare(func1, func2)).toBeFalse();
      expect(Utils.compare(func2, func3)).toBeFalse();
      expect(Utils.compare(func1, func3)).toBeFalse();
    });
  });

  describe('hasFlag()', () => {
    const e14: TestEnum = TestEnum.Option1 | TestEnum.Option4;
    const e256: TestEnum = TestEnum.Option2 | TestEnum.Option5 | TestEnum.Option6;

    it('should test for flags', () => {
      expect(Utils.hasFlag<TestEnum>(undefined, TestEnum.None)).toBeFalse();
      expect(Utils.hasFlag<TestEnum>(undefined, TestEnum.Option1)).toBeFalse();
      expect(Utils.hasFlag<TestEnum>(null as unknown as TestEnum, TestEnum.None)).toBeFalse();
      expect(Utils.hasFlag<TestEnum>(null as unknown as TestEnum, TestEnum.Option3)).toBeFalse();
      expect(Utils.hasFlag<TestEnum>(0, TestEnum.None)).toBeTrue();
      expect(Utils.hasFlag<TestEnum>(1, TestEnum.Option1)).toBeTrue();
      expect(Utils.hasFlag<TestEnum>(4, TestEnum.Option3)).toBeTrue();

      expect(Utils.hasFlag(e14, TestEnum.Option1)).toBeTrue();
      expect(Utils.hasFlag(e14, TestEnum.Option2)).toBeFalse();
      expect(Utils.hasFlag(e14, TestEnum.Option3)).toBeFalse();
      expect(Utils.hasFlag(e14, TestEnum.Option4)).toBeTrue();

      expect(Utils.hasFlag(e256, TestEnum.Option1)).toBeFalse();
      expect(Utils.hasFlag(e256, TestEnum.Option2)).toBeTrue();
      expect(Utils.hasFlag(e256, TestEnum.Option3)).toBeFalse();
      expect(Utils.hasFlag(e256, TestEnum.Option4)).toBeFalse();
      expect(Utils.hasFlag(e256, TestEnum.Option5)).toBeTrue();
      expect(Utils.hasFlag(e256, TestEnum.Option6)).toBeTrue();
    });
  });

  it('should sleep and wake up', fakeAsync(() => {
    let awake = false;
    Utils.sleep(1000).then(() => awake = true);

    expect(awake).toBeFalse();
    tick(600);
    expect(awake).toBeFalse();
    tick(600);
    expect(awake).toBeTrue();
  }));
});
