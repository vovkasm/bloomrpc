export function castToError(e: unknown): Error {
  if (!e) return new Error('Unknown falsy error');
  return e instanceof Error ? e : new Error((e as any)?.message || e);
}