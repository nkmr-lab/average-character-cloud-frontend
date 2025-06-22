export function hexToNumber(hex: string): number {
  return parseInt(hex.replace("#", ""), 16);
}

export function numberToHex(num: number): string {
  return `#${num.toString(16).padStart(6, "0")}`;
}
