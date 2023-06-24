export interface Serializer {
  serialize(value: object): string;
  deserialize<T>(value: string): T;
}
