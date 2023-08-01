export class Lazy<T> {
  private _value: T | undefined;
  private valueSet = false;

  public constructor(private readonly valueFactory: () => T) { }

  public get value(): T {
    if (!this.valueSet) {
      this._value = this.valueFactory();
      this.valueSet = true;
    }

    return this._value!;
  }
}
