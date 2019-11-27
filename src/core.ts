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

function badImportsIn(rootNode: ts.Node, decider: Decider): readonly ImportDetails[] {
    const errorAccumulator: ImportDetails[] = [];
    checkNode(rootNode, decider, errorAccumulator);
    return errorAccumulator;
}

function checkNode(node: ts.Node, decider: Decider, errorAccumulator: ImportDetails[]): void {
    if (isImportOrExportDeclaration(node)) {
        checkDeclaration(node, decider, errorAccumulator);
    } else {
        ts.forEachChild(node, n => checkNode(n, decider, errorAccumulator));
    }
}

function checkDeclaration(declaration: InterestingNode, decider: Decider, errorAccumulator: ImportDetails[]): void {
    declaration.forEachChild(node => {
        if (ts.isStringLiteral(node) || ts.isExternalModuleReference(node)) {
            const stringLiteral = (
                ts.isExternalModuleReference(node)
                ? node.expression as ts.StringLiteral // (It is a grammar error otherwise.)
                : node
            );
            const importPath = unquote(stringLiteral.getFullText().trim());
            if (isRestricted(importPath, decider)) {
                errorAccumulator.push({ path: importPath, node: declaration });
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

function isImportOrExportDeclaration(node: ts.Node): node is InterestingNode {
    return [
        ts.isImportDeclaration,
        ts.isExportDeclaration,
        ts.isImportEqualsDeclaration,
    ].some(f => f(node));
}

// Just strips the first and last character.
function unquote(quoted: string): string {
    return quoted.substring(1, quoted.length - 1);
}
