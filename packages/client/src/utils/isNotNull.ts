export default function isNotNull<T>(value: T | null): value is T {
  return value !== null;
}
