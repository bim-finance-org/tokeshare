/**
 * Returns the values of a TypeScript enum.
 *
 * Supports string and numeric enums.
 *
 * @template T - Enum type
 * @param {T} enumObj - Enum object
 * @returns {T[keyof T][]} Array of enum values
 */
export function getEnumValues<T extends Record<string, string | number>>(enumObj: T): T[keyof T][] {
  return Object.values(enumObj) as T[keyof T][];
}
