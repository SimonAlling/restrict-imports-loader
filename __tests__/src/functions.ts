import * as tsInFunctions from "typescript";

tsInFunctions.createThis();

export function id<T>(x: T): T {
    return x;
}
