import { Serializer } from './serializer';

export class SmartSerializer implements Serializer {
  private static readonly escapers = [
    <Escaper<Date>>{
      char: '@',
      mustReplace: (v) => v instanceof Date,
      replacer: (v) => v.toJSON(),
      reviver: (s) => new Date(s)
    },
    <Escaper<BigInt>>{
      char: '#',
      mustReplace: (v) => typeof v === 'bigint',
      replacer: (v) => v.toString(),
      reviver: (s) => BigInt(s)
    }
  ];

  public serialize(value: object): string {
    return JSON.stringify(value, (k, v) => {

      if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
        const entries = Object.entries(v);

        if (entries.length > 0) {
          return entries
            .sort((a, b) => a[0].localeCompare(b[0]))
            .reduce((acc, cur) => ({ ...acc, [cur[0]]: this.escape(cur[1]) }), {});
        }
      }

      return v;
    });
  }

  public deserialize<T>(value: string): T {
    return JSON.parse(value, (k, v) => {

      if ((typeof v === 'string' || v instanceof String)) {
        const unesc = SmartSerializer.escapers.find(e => v.startsWith(e.char));
        if (unesc) {
          const pure = v.slice(1);
          if (pure.startsWith(unesc.char)) {
            return pure;
          } else {
            return unesc.reviver(pure);
          }
        }
      }

      return v;
    });
  }

  private escape(value: any): unknown {
    const escaper = SmartSerializer.escapers.find(e => e.mustReplace(value));
    if (escaper) {
      return `${escaper.char}${escaper.replacer(value)}`
    }

    if ((typeof value === 'string' || value instanceof String) && SmartSerializer.escapers.some(e => value.startsWith(e.char))) {
      return `${value[0]}${value}`;
    }

    return value;
  }
}

interface Escaper<T> {
  char: string;
  mustReplace: (v: unknown) => boolean;
  replacer: (v: T) => string;
  reviver: (s: string) => T;
}
