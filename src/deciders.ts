import * as path from "path";

import * as core from "./core";
import { LoaderFunctionDecider } from "./loader";

// packageName can be e.g. "typescript" or "typescript/lib".
export function everythingInPackage(packageName: string): core.AsyncDeciderFunction {
    return matchedBy(new RegExp(String.raw`^${packageName}(\/.*)?$`));
}

export function matchedBy(r: RegExp): core.AsyncDeciderFunction {
    return importPath => Promise.resolve({ restricted: r.test(importPath) });
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
                    resolve({
                        restricted: insideIsRestricted === dirs.some(contains(result)),
                        info: `(resolved: ${result})`,
                    });
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
