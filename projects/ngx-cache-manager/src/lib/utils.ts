export class Utils {
  /**
     * Clones a variable.
     *
     * @param value A variable to clone.
     * @returns A deep copy if the value is an object, otherwise the value itself.
     */
  public static clone<T>(value: T): T {
    if (value instanceof Date) {
      return new Date(value) as T;
    }

    if (Array.isArray(value)) {
      return value.map(x => Utils.clone(x)) as T;
    }

    if (value !== null && typeof value === 'object') {
      return Object.entries(value).reduce((acc, cur) => ({ ...acc, [cur[0]]: Utils.clone(cur[1]) }), {}) as T;
    }

    return value;
  }

  /**
    * Deep compares two values.
    * @param value1 First value to compare.
    * @param value2 Second value to compare.
    * @returns True if the values are equal.
    */
  public static compare<T>(value1: T, value2: T): boolean {
    // Special check for dates.
    if (value1 instanceof Date && value2 instanceof Date) {
      return value1.getTime() === value2.getTime();
    }

    // True if same primitives or objects.
    if (value1 === value2) {
      return true;
    }

    // Both objects.
    if (value1 !== null && value2 !== null && typeof value1 === 'object' && typeof value2 === 'object') {
      const entries1 = Object.entries(value1);
      const entries2 = Object.entries(value2);

      if (entries1.length !== entries2.length) {
        return false; // Different number of entries means that the objects are different.
      }

      const sorted1 = Array.isArray(value1) ? entries1 : entries1.sort((a, b) => a[0].localeCompare(b[0]));
      const sorted2 = Array.isArray(value2) ? entries2 : entries2.sort((a, b) => a[0].localeCompare(b[0]));

      for (let i = 0; i < entries1.length; i++) {
        if (sorted1[i][0] !== sorted2[i][0] || !Utils.compare(sorted1[i][1], sorted2[i][1])) {
          return false; // False if either names or values don't match.
        }
      }

      return true; // All items have been successfully compared.
    }

    return false;
  }

  /**
   * @summary check whether the enum has the flag.
   * @param {number} enumValue the enum value.
   * @param {number} flagToCheck the flag to check.
   * @returns {boolean} whether the enum has the flag.
   */
  public static hasFlag<E extends number>(enumValue: E | undefined, flagToCheck: E): boolean {
    return enumValue != null && (enumValue === flagToCheck /*this includes 0*/ || (enumValue & flagToCheck) === flagToCheck);
  }

  /**
   * @summary Puts code execution on hold
   * @param ms A number of miliseconds to hold for
   * @returns A Promise
   */
  public static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
