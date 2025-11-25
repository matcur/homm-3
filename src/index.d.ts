export {}; // 👈 makes the file a module

declare global {
  interface Array<T> {
    includes<K>(item: T, fromIndex?: number): boolean;
    indexOf<K>(item: T, fromIndex?: number): number;
    lastIndexOf<K>(item: T, fromIndex?: number): number;
    push<K>(...items: T[]): number;
    unshift<K>(...items: T[]): number;
  }
  interface JSOGStatic {
    stringify(obj: any): string;
    parse<T = any>(text: string): T;
  }
  const JSOG: JSOGStatic;
}