import { cache } from "./cache-decorator";

describe('@cache()', () => {
  it('should capture', () => {
    const test1 = new CacheDecoratorTest();
    test1.testMethod('xxx', 666, false);
    test1.testMethod('yyy', 777, true);
    const test2 = new CacheDecoratorTest();
    test2.testMethod('xxx2', 6662, false);
    test2.testMethod('yyy2', 7772, true);
  });
});

class CacheDecoratorTest {
  @cache()
  public testMethod(a: string, b: number, c: boolean): string {
    return JSON.stringify({ a, b, c });
  }
}
