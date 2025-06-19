import * as utf8 from "../utils/utf8";

export function parseCharacter(character: string | undefined): string {
  const defaultValue = "あ";

  if (character === undefined) {
    return defaultValue;
  }

  try {
    const value = utf8.fromBase64(character);
    return [...value][0] ?? defaultValue;
  } catch {
    return defaultValue;
  }
}

export function parseStrokeCount(
  strokeCount: string | undefined
): number | undefined {
  if (strokeCount === undefined) {
    return undefined;
  }

  const parsed = Number(strokeCount);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 1000) {
    return undefined;
  }
  return parsed;
}
