export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function* chunkArray<T>(arr: T[], batchSize: number): Generator<T[]> {
  for (let i = 0; i < arr.length; i += batchSize) {
    yield arr.slice(i, i + batchSize);
  }
}

export function uniqueArray<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}
