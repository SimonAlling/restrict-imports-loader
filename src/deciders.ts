import * as path from "path";

import * as core from "./core";
import { LoaderFunctionDecider } from "./loader";

const UP_ONE_LEVEL_LENGTH = 3; // "../"
const REGEX_UP_LEVELS = new RegExp(String.raw`(?:\.\.\/)+`, "g");

// packageName can be e.g. "typescript" or "typescript/lib".
export function everythingInPackage(packageName: string): core.AsyncDeciderFunction {
    return matchedBy(new RegExp(String.raw`^${packageName}(\/.*)?$`));
}

export function matchedBy(r: RegExp): core.AsyncDeciderFunction {
    return importPath => Promise.resolve({ restricted: r.test(importPath) });
}

export function climbingUpwardsMoreThan(levels: number): core.AsyncDeciderFunction {
    return importPath => {
        const maxLength = lengthOfLongestMatch(normalize(importPath).match(REGEX_UP_LEVELS));
        const maxClimbs = maxLength / UP_ONE_LEVEL_LENGTH;
        const s = maxClimbs === 1 ? "" : "s";
        return Promise.resolve({
            restricted: maxClimbs > levels,
            info: `(contains ${maxClimbs} consecutive occurrence${s} of "../"; max ${levels} allowed)`,
        });
    };
}

function lengthOfLongestMatch(matches: RegExpMatchArray | null): number {
    return (
        matches === null
        ? 0
        : matches.reduce((acc, m) => Math.max(acc, m.length), 0)
    );
}

// Merges consecutive slashes, then replaces "/./" with "/". Different from path.normalize.
function normalize(importPath: string): string {
    return importPath.replace(/\/+/g, "/").replace(/\/\.\//g, "/");
}

export const everythingInside = everything(true);

export const everythingOutside = everything(false);

// dirs must be a list of absolute directory paths.
// Either inside or outside dirs will be restricted, depending on the value of insideIsRestricted.
function everything(insideIsRestricted: boolean): (dirs: readonly string[]) => LoaderFunctionDecider {
    return dirs => {
        return (importPath, loaderContext) => new Promise((resolve, reject) => {
            loaderContext.resolve(loaderContext.context, importPath, (err, result) => {
                if (err === null) {
                    if (typeof result === "string") {
                        resolve({
                            restricted: insideIsRestricted === dirs.some(contains(result)),
                            info: `(resolved: ${result})`,
                        });
                    } else {
                        reject(`Expected a string, but result was: ${JSON.stringify(result)}`);
                    }
                } else {
                    reject(err.message);
                }
            });
        });
    };
}

function contains(contained: string): (dir: string) => boolean {
    return dir => {
        const relative = path.relative(dir, contained);
        return !relative.startsWith("..") && !path.isAbsolute(relative);
    };
}
