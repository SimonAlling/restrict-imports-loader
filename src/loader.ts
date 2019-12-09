import { getOptions } from "loader-utils";
import validateOptions from "schema-utils";
import * as webpack from "webpack";

import * as core from "./core";
import * as deciders from "./deciders";
import { indentBy, quote } from "./text";
import { defaultTo } from "./utilities";

const DEFAULT = {
    info: `Found restricted imports:`,
    detailedErrorMessages: true,
} as const;

const CONFIG = {
    name: "restrict-imports-loader",
} as const;

export type Severity = "fatal" | "error" | "warning";

const SEVERITIES: Severity[] = [ "fatal", "error", "warning" ];

type LoaderContext = webpack.loader.LoaderContext;

export type LoaderFunctionDecider = (importPath: string, loaderContext: webpack.loader.LoaderContext) => Promise<core.Decision>;

export type LoaderDecider = RegExp | LoaderFunctionDecider;

type LoaderRule = {
    // Must be kept in sync with SCHEMA.
    restricted: LoaderDecider
    severity?: Severity
    info?: string
};

export type LoaderOptions = {
    // Must be kept in sync with SCHEMA.
    detailedErrorMessages?: boolean
    severity: Severity
    rules: readonly LoaderRule[]
};

// `as const` assertions are necessary because `as const` on entire schema does not typecheck and the type of a string literal is inferred as string by default.
const SCHEMA = {
    // Must be kept in sync with LoaderOptions type.
    type: "object" as const,
    required: [ "rules", "severity" ],
    properties: {
        detailedErrorMessages: {
            description: `Include the faulty import statement when printing an error message (default: ${quote(DEFAULT.detailedErrorMessages.toString())}). If disabled, only the import path (e.g. "typescript") is included.`,
            type: "boolean" as const,
        },
        rules: {
            description: "List of rules to check against.",
            items: {
                type: "object" as const,
                required: [ "restricted" ],
                properties: {
                    restricted: {
                        description: `Regular expression or function (of type (string, webpack.loader.LoaderContext) => Promise<boolean>) specifying which imports should be restricted.`,
                        anyOf: [
                            { instanceof: "RegExp" },
                            { instanceof: "Function" },
                        ],
                    },
                    severity: {
                        description: `Severity for this specific rule.`,
                        anyOf: [
                            { enum: SEVERITIES },
                        ],
                    },
                    info: {
                        description: `An informational message to show to the user (default: ${quote(DEFAULT.info)})`,
                        type: "string" as const,
                    },
                },
            },
        },
        severity: {
            description: `Controls what happens if a restricted import is detected. Can be overridden for individual rules.`,
            anyOf: [
                { enum: SEVERITIES },
            ],
        },
    },
    additionalProperties: false,
};

export function run(loaderContext: LoaderContext, source: string): void {
    const callback = loaderContext.async();
    if (callback === undefined) throw new Error(`Webpack did not provide an async callback.`);
    const options = getOptions(loaderContext) as LoaderOptions;
    validateOptions(SCHEMA, options, CONFIG);
    const rules = options.rules;
    const detailedErrorMessages = defaultTo(DEFAULT.detailedErrorMessages, options.detailedErrorMessages);
    core.checkAsync({
        source: source,
        deciders: rules.map(r => r.restricted).map(deciderFunction(loaderContext)),
        fileName: loaderContext.resourcePath,
        setParentNodes: detailedErrorMessages,
    }).then(badImportMatrix => {
        rules.forEach((rule, i) => {
            const badImports = badImportMatrix[i];
            if (badImports.length > 0) {
                const severity = defaultTo(options.severity, rule.severity);
                const info = defaultTo(DEFAULT.info, rule.info);
                const err = new Error(errorMessageForAll(badImports, info, detailedErrorMessages));
                switch (severity) {
                    case "fatal":
                        // Throwing here breaks forEach; calling callback does not.
                        throw err;
                    case "error":
                        loaderContext.emitError(err);
                        break;
                    case "warning":
                        loaderContext.emitWarning(err);
                        break;
                    default:
                        const _: never = severity; throw _; // enforces exhaustiveness
                }
            }
        });
        callback(null, source);
    }).catch(err => {
        callback(err, source);
    });
}

function deciderFunction(loaderContext: LoaderContext): (decider: LoaderDecider) => core.AsyncDeciderFunction {
    return decider => (
        decider instanceof RegExp
        ? deciders.matchedBy(decider)
        : importPath => decider(importPath, loaderContext)
    );
}

function errorMessageForAll(imports: readonly core.RestrictedImportDetails[], info: string, setParentNodesWasUsed: boolean): string {
    return [
        info,
        "",
        indentBy(2)(imports.map(errorMessage(setParentNodesWasUsed)).join("")).trimRight(),
        "",
        "",
    ].join("\n");
}

function errorMessage(setParentNodesWasUsed: boolean): (i: core.RestrictedImportDetails) => string {
    const details = (i: core.RestrictedImportDetails) => (
        setParentNodesWasUsed
        ? [
            `:`,
            ``,
            indentBy(6 /* bullet + space + 4 spaces */)(i.node.getText()),
            ``,
            i.info ? indentBy(2 /* bullet + space */)(i.info) + "\n\n" : "",
        ].join("\n")
        : ""
    );
    return i => `• ` + quote(i.path) + `, imported on line ${i.line}` + details(i) + `\n`;
}
