type MemoizedFn<T extends readonly unknown[], R> = (...args: T) => R;

/**
 * Prosta memoizacja z WeakMap — kluczowany po pierwszym argumencie (zazwyczaj obiekt DTO).
 * Zwolnienie pamieci dzieki WeakMap, gdy obiekt nie jest juz uzywany.
 */
export function memoize<T extends readonly unknown[], R>(
  fn: (...args: T) => R
): MemoizedFn<T, R> {
  const cache = new WeakMap<object, R>();

  return ((...args: T): R => {
    const key = args[0] as object;
    if (key == null || typeof key !== 'object') {
      return fn(...args);
    }

    const cached = cache.get(key);
    if (cached !== undefined) {
      return cached;
    }

    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as MemoizedFn<T, R>;
}
