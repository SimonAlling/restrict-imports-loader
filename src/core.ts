import ts from "typescript";

type ImportDetails = Readonly<{
    path: string
    node: ts.Node
    line: number // 1-indexed
}>;

export type RestrictedImportDetails = ImportDetails & Readonly<{
    info: string | undefined
}>;

export type Decision = { restricted: false } | { restricted: true, info?: string };

export type AsyncDeciderFunction = (importPath: string) => Promise<Decision>;

type InterestingNode = ts.ImportDeclaration | ts.ExportDeclaration | ts.ImportEqualsDeclaration;

export async function checkAsync(x: {
    source: string,
    deciders: readonly AsyncDeciderFunction[],
    fileName: string,
    setParentNodes: boolean,
}): Promise<ReadonlyArray<ReadonlyArray<RestrictedImportDetails>>> {
    const sourceFile = ts.createSourceFile(x.fileName, x.source, ts.ScriptTarget.Latest, x.setParentNodes);
    const imports = importsIn(sourceFile);
    return Promise.all(x.deciders.map(decider => onlyRestricted(decider, imports)));
}

async function onlyRestricted(
    decider: AsyncDeciderFunction,
    is: readonly ImportDetails[],
): Promise<readonly RestrictedImportDetails[]> {
    const isAndDecisions = await Promise.all(
        is.map(i => decider(i.path).then(decision => ({ i, decision })))
    );
    const results: RestrictedImportDetails[] = [];
    for (const iAndD of isAndDecisions) {
        if (iAndD.decision.restricted) {
            results.push({ ...iAndD.i, info: iAndD.decision.info });
        }
    }
    return results;
}

function importsIn(rootNode: ts.SourceFile): readonly ImportDetails[] {
    const accumulator: ImportDetails[] = [];
    const getLineNumber = (
        // Lines are 0-indexed by the parser, so we add 1.
        (node: ts.Node) => 1 + rootNode.getLineAndCharacterOfPosition(node.pos).line
    );
    // Only SourceFiles can contain interesting nodes; imports in namespace/module blocks cannot reference modules.
    ts.forEachChild(rootNode, node => {
        if (isInteresting(node)) lookForImportsIn(node, accumulator, getLineNumber);
    });
    return accumulator;
}

function lookForImportsIn(
    interestingNode: InterestingNode,
    accumulator: ImportDetails[],
    getLineNumber: (node: ts.Node) => number,
): void {
    interestingNode.forEachChild(node => {
        if (ts.isStringLiteral(node) || ts.isExternalModuleReference(node)) {
            const stringLiteral = (
                ts.isExternalModuleReference(node)
                ? node.expression as ts.StringLiteral // (It is a grammar error otherwise.)
                : node
            );
            accumulator.push({
                path: stringLiteral.text,
                node: interestingNode,
                line: getLineNumber(stringLiteral),
            });
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
