export function defaultTo<T>(def: T, x: T | undefined): T {
    return x === undefined ? def : x;
}
