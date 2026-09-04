/**
 * Bounded-concurrency `map` for async iterables.
 *
 * Implemented locally so published CommonJS chunks never static-import the
 * ESM-only `p-map` package (see #22609).
 */
export const pMapSkip = Symbol('pMapSkip');

type PMapOptions = {
  concurrency?: number;
  stopOnError?: boolean;
};

async function toIterator<T>(iterable: Iterable<T> | AsyncIterable<T>): Promise<AsyncIterator<T>> {
  if (Symbol.asyncIterator in iterable) {
    return (iterable as AsyncIterable<T>)[Symbol.asyncIterator]();
  }

  return (async function* () {
    for (const value of iterable as Iterable<T>) {
      yield value;
    }
  })();
}

export async function pMap<Element, Result>(
  iterable: Iterable<Element> | AsyncIterable<Element>,
  mapper: (element: Element, index: number) => Result | typeof pMapSkip | Promise<Result | typeof pMapSkip>,
  options: PMapOptions = {},
): Promise<Result[]> {
  const concurrency = Math.max(1, options.concurrency ?? Number.POSITIVE_INFINITY);
  const stopOnError = options.stopOnError ?? true;
  const iterator = await toIterator(iterable);
  const results: Result[] = [];
  const executing = new Set<Promise<void>>();
  let index = 0;
  let isDone = false;
  let error: unknown;

  const run = async (element: Element, elementIndex: number) => {
    const mapped = await mapper(element, elementIndex);
    if (mapped !== pMapSkip) {
      results[elementIndex] = mapped;
    }
  };

  while (!isDone || executing.size > 0) {
    while (!isDone && executing.size < concurrency) {
      const next = await iterator.next();
      if (next.done) {
        isDone = true;
        break;
      }

      const currentIndex = index++;
      const task = run(next.value, currentIndex).catch(caught => {
        if (stopOnError) {
          error = caught;
        }
      });

      executing.add(task);
      void task.finally(() => executing.delete(task));
    }

    if (error) {
      throw error;
    }

    if (executing.size > 0) {
      await Promise.race(executing);
    }
  }

  return results.filter((value): value is Result => value !== undefined);
}
