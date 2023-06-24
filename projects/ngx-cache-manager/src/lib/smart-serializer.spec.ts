import { SmartSerializer } from './smart-serializer';

describe('Serializer', () => {
  it('should serialize and deserialize', () => {
    const serializer = new SmartSerializer();
    const obj1 = {
      a: 'abc',
      b: 123,
      c: true,
      d: new Date(),
      e: 666n,
      f: [
        {
          aa: 'abc2',
          bb: 1234,
          cc: false,
          dd: {
            aaa: 'abc3',
            bbb: 12345,
            ccc: true,
          }
        },
        40,
        'str'
      ],
      g: {
        aa: 'abc4',
        bb: 555,
        cc: false,
        dd: {
          aaa: 'abc5',
          bbb: 777,
          ccc: true,
        }
      },
      h: '@dhdhsdfd',
      i: '#dsdushduid',
      j: '@#fjsdkjflksd',
      k: '#@flvjdfvdvnjd'
    };

    const serialized = serializer.serialize(obj1);
    const deserialized = serializer.deserialize<any>(serialized);
    const serialized2 = serializer.serialize(deserialized);
    const deserialized2 = serializer.deserialize<any>(serialized2);

    expect(serialized).toBeTruthy();
    expect(deserialized).toEqual(obj1);
    expect(deserialized.d instanceof Date).toBeTrue();
    expect(deserialized.d.getTime()).toBe(obj1.d.getTime());
    expect(typeof deserialized.e).toBe('bigint');

    expect(serialized2).toBeTruthy();
    expect(deserialized2).toEqual(obj1);
    expect(deserialized2.d instanceof Date).toBeTrue();
    expect(deserialized2.d.getTime()).toBe(obj1.d.getTime());
    expect(typeof deserialized2.e).toBe('bigint');
  });
});
