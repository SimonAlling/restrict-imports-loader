import * as webpack from "webpack";

import * as core from "./core";
import * as loader from "./loader";
import { defaultTo } from "./utilities";

export { ImportDetails } from "./core";

export { LoaderDecider, LoaderOptions, Severity } from "./loader";

export { everythingInPackage } from "./deciders";

export default function(this: webpack.loader.LoaderContext, source: string) {
    loader.run(this, source);
}

export type SyncDecider = RegExp | core.SyncDeciderFunction;

export function check(x: {
    source: string,
    restricted: readonly SyncDecider[],
    fileName?: string,
    setParentNodes?: boolean,
}): ReadonlyArray<ReadonlyArray<core.ImportDetails>> {
    return core.checkSync({
        source: x.source,
        deciders: x.restricted.map(deciderFunction),
        fileName: defaultTo("", x.fileName),
        setParentNodes: defaultTo(true, x.setParentNodes),
    });
}

function deciderFunction(decider: SyncDecider): core.SyncDeciderFunction {
    return (
        decider instanceof RegExp
        ? core.fromRegex(decider)
        : decider
    );
}
