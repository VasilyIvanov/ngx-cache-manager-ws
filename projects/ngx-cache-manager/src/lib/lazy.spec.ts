import { fakeAsync, tick } from "@angular/core/testing";
import { Lazy } from "./lazy";

describe('Lazy', () => {
  it('should lazy load and the reuse the value', fakeAsync(() => {
    const lazy = new Lazy<number>(() => Date.now());
    const started = Date.now();
    tick(1000); // Let some time pass
    const current1 = lazy.value;
    // If the value is lazy loaded, it will contain the current time, not that one when it was created.
    expect(current1).toBeGreaterThan(started + 900 /*just in case*/);

    // When the value is already created, it will be reused.
    tick(1000);
    const current2 = lazy.value;
    expect(current2).toBe(current1);
  }));

  it('should work with undefined too', fakeAsync(() => {
    let counter = 0;
    const lazy = new Lazy<undefined>(() => {
      counter++;
      return undefined;
    });
    const current1 = lazy.value;
    expect(current1).toBeUndefined();
    expect(counter).toBe(1);

    tick(1000);
    const current2 = lazy.value;
    expect(current2).toBeUndefined();
    expect(counter).toBe(1); // Factory hasn't been called again.
  }));
});
