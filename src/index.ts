import * as webpack from "webpack";

import * as core from "./core";
import * as loader from "./loader";

export { RestrictedImportDetails, checkAsync } from "./core";

export { LoaderDecider, LoaderOptions, Severity } from "./loader";

export {
    climbingUpwardsMoreThan,
    everythingInPackage,
    everythingInside,
    everythingOutside,
    matchedBy,
} from "./deciders";

export default function(this: webpack.LoaderContext<unknown>, source: string) {
    loader.run(this, source);
}

export type AsyncDecider = RegExp | core.AsyncDeciderFunction;
