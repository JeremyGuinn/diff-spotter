/* eslint-disable @typescript-eslint/no-explicit-any */
export function memoize(fn: (...args: any[]) => any) {
  const cache = new WeakMap();
  return (...args: any[]) => {
    if (cache.has(args)) {
      return cache.get(args);
    }
    const result = fn(...args);
    cache.set(args, result);
    return result;
  };
}
