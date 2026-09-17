const executions = new Map<string, { expiresAt: number; result: Promise<unknown> }>();

export function runExecutionOnce<T>(key: string, operation: () => Promise<T>, now = Date.now()): Promise<T> {
  for (const [storedKey, entry] of executions) if (entry.expiresAt <= now) executions.delete(storedKey);
  const existing = executions.get(key);
  if (existing) return existing.result as Promise<T>;
  const result = operation();
  executions.set(key, { expiresAt: now + 5 * 60_000, result });
  return result;
}

export function clearExecutionCacheForTests(): void { executions.clear(); }
