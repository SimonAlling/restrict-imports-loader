import * as path from "path";

import { LoaderDecider } from "./loader";

// packageName can be e.g. "typescript" or "typescript/lib".
export function everythingInPackage(packageName: string): RegExp {
    return new RegExp(String.raw`^${packageName}(\/.*)?$`);
}

// dirs must be a list of absolute directory paths.
export function everythingOutside(allowedDirs: readonly string[]): LoaderDecider {
    return (importPath, loaderContext) => new Promise((resolve, reject) => {
        loaderContext.resolve(loaderContext.context, importPath, (err, result) => {
            if (err === null) {
                const containsResult = (dir: string) => {
                    const relative = path.relative(dir, result);
                    return !relative.startsWith("..") && !path.isAbsolute(relative);
                };
                resolve(!allowedDirs.some(containsResult));
            } else {
                reject(err.message);
            }
        });
    });
}
