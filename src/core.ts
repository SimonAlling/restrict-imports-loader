import ts from "typescript";

export type ImportDetails = Readonly<{
    path: string
    node: ts.Node
}>;

export type Decider = RegExp | ((importPath: string) => boolean);

export type Deciders = readonly Decider[];

type InterestingNode = ts.ImportDeclaration | ts.ExportDeclaration | ts.ImportEqualsDeclaration;

export function check(x: {
    source: string,
    deciders: Deciders,
    fileName: string,
}): ReadonlyArray<ReadonlyArray<ImportDetails>> {
    const sourceFile = ts.createSourceFile(x.fileName, x.source, ts.ScriptTarget.Latest, true);
    return x.deciders.map(decider => badImportsIn(sourceFile, decider));
}

function badImportsIn(rootNode: ts.SourceFile, decider: Decider): readonly ImportDetails[] {
    const errorAccumulator: ImportDetails[] = [];
    // Only SourceFiles can contain interesting nodes; imports in namespace/module blocks cannot reference modules.
    ts.forEachChild(rootNode, node => {
        if (isInteresting(node)) checkInteresting(node, decider, errorAccumulator);
    });
    return errorAccumulator;
}

function checkInteresting(interestingNode: InterestingNode, decider: Decider, errorAccumulator: ImportDetails[]): void {
    interestingNode.forEachChild(node => {
        if (ts.isStringLiteral(node) || ts.isExternalModuleReference(node)) {
            const importPath = (
                ts.isExternalModuleReference(node)
                ? node.expression as ts.StringLiteral // (It is a grammar error otherwise.)
                : node
            ).text;
            if (isRestricted(importPath, decider)) {
                errorAccumulator.push({ path: importPath, node: interestingNode });
            }
        }
    });
}

function isRestricted(name: string, decider: Decider): boolean {
    return (
        decider instanceof RegExp
        ? decider.test(name)
        : decider(name)
    );
}

function isInteresting(node: ts.Node): node is InterestingNode {
    return [
        ts.isImportDeclaration,
        ts.isExportDeclaration,
        ts.isImportEqualsDeclaration,
    ].some(f => f(node));
}
