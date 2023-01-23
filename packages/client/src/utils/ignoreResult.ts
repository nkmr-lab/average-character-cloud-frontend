export default function ignoreResult<P extends any[], R>(
  fn: (...args: P) => R
): (...args: P) => void {
  return (...args: P) => {
    fn(...args);
  };
}
