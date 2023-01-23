export function toBase64(str: string): string {
  return window.btoa(String.fromCharCode(...new TextEncoder().encode(str)));
}

export function fromBase64(str: string): string {
  return new TextDecoder().decode(
    Uint8Array.from(window.atob(str), (str) => str.charCodeAt(0))
  );
}
