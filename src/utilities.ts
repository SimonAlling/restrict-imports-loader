export function defaultTo<T>(def: T, x: T | undefined): T {
    return x === undefined ? def : x;
}

// Inspired by https://www.npmjs.com/package/node-filter-async
export async function filterAsync<T>(
    xs: readonly T[],
    predicate: (value: T) => Promise<boolean>,
): Promise<T[]> {
    const predicateOutputs = await Promise.all(xs.map(predicate));
    return xs.filter((_, i) => predicateOutputs[i]);
}
