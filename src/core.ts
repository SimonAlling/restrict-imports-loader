import ts from "typescript";

import { filterAsync } from "./utilities";

export type ImportDetails = Readonly<{
    path: string
    node: ts.Node
}>;

type DeciderFunction<T> = (importPath: string) => T;

export type AsyncDeciderFunction = DeciderFunction<Promise<boolean>>;

export type SyncDeciderFunction = DeciderFunction<boolean>;

type InterestingNode = ts.ImportDeclaration | ts.ExportDeclaration | ts.ImportEqualsDeclaration;

export function checkSync(x: {
    source: string,
    deciders: readonly SyncDeciderFunction[],
    fileName: string,
    setParentNodes: boolean,
}): ReadonlyArray<ReadonlyArray<ImportDetails>> {
    const sourceFile = ts.createSourceFile(x.fileName, x.source, ts.ScriptTarget.Latest, x.setParentNodes);
    const imports = importsIn(sourceFile);
    return x.deciders.map(decider => imports.filter(i => decider(i.path)));
}

export async function checkAsync(x: {
    source: string,
    deciders: readonly AsyncDeciderFunction[],
    fileName: string,
    setParentNodes: boolean,
}): Promise<ReadonlyArray<ReadonlyArray<ImportDetails>>> {
    const sourceFile = ts.createSourceFile(x.fileName, x.source, ts.ScriptTarget.Latest, x.setParentNodes);
    const imports = importsIn(sourceFile);
    return Promise.all(x.deciders.map(async decider => await filterAsync(imports, i => decider(i.path))));
}

export function fromRegex(r: RegExp): SyncDeciderFunction {
    return importPath => r.test(importPath);
}

function importsIn(rootNode: ts.SourceFile): readonly ImportDetails[] {
    const accumulator: ImportDetails[] = [];
    // Only SourceFiles can contain interesting nodes; imports in namespace/module blocks cannot reference modules.
    ts.forEachChild(rootNode, node => {
        if (isInteresting(node)) lookForImportsIn(node, accumulator);
    });
    return accumulator;
}

function lookForImportsIn(interestingNode: InterestingNode, accumulator: ImportDetails[]): void {
    interestingNode.forEachChild(node => {
        if (ts.isStringLiteral(node) || ts.isExternalModuleReference(node)) {
            const importPath = (
                ts.isExternalModuleReference(node)
                ? node.expression as ts.StringLiteral // (It is a grammar error otherwise.)
                : node
            ).text;
            accumulator.push({ path: importPath, node: interestingNode });
        }
    });
}

function isInteresting(node: ts.Node): node is InterestingNode {
    return [
        ts.isImportDeclaration,
        ts.isExportDeclaration,
        ts.isImportEqualsDeclaration,
    ].some(f => f(node));
}
