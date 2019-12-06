// packageName can be e.g. "typescript" or "typescript/lib".
export function everythingInPackage(packageName: string): RegExp {
    return new RegExp(String.raw`^${packageName}(\/.*)?$`);
}
