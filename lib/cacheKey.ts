export function stableKey(input: unknown) {
  if (input === undefined) return "undefined";
  return JSON.stringify(input, Object.keys(input as any).sort());
}
