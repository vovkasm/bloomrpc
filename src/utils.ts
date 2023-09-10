export function castToError(e: unknown): Error {
  if (!e) return new Error('Unknown falsy error');
  return e instanceof Error ? e : new Error((e as any)?.message || e);
}

export function strcmp(a: string, b: string): -1 | 0 | 1 {
  return a < b ? -1 : (a > b ? 1 : 0);
}