import * as path from "path";

import { LoaderDecider } from "./loader";

// packageName can be e.g. "typescript" or "typescript/lib".
export function everythingInPackage(packageName: string): RegExp {
    return new RegExp(String.raw`^${packageName}(\/.*)?$`);
}

export const everythingInside = everything(true);

export const everythingOutside = everything(false);

// dirs must be a list of absolute directory paths.
// Either inside or outside dirs will be restricted, depending on the value of insideIsRestricted.
function everything(insideIsRestricted: boolean): (dirs: readonly string[]) => LoaderDecider {
    return dirs => {
        return (importPath, loaderContext) => new Promise((resolve, reject) => {
            loaderContext.resolve(loaderContext.context, importPath, (err, result) => {
                if (err === null) {
                    resolve(insideIsRestricted === dirs.some(contains(result)));
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
