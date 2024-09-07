export function isValue(
  value: number | string | null | undefined
): value is number | string {
  return !(value == null || value === '' || value !== value);
}
