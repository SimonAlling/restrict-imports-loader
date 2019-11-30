import { getOptions } from "loader-utils";
import validateOptions from "schema-utils";
import * as webpack from "webpack";

import * as core from "./core";
import { indentBy, quote } from "./text";
import { defaultTo } from "./utilities";

const DEFAULT = {
    info: `Found restricted imports.`,
    detailedErrorMessages: true,
} as const;

const CONFIG = {
    name: "restrict-imports-loader",
} as const;

export type Severity = "fatal" | "error" | "warning";

const SEVERITIES: Severity[] = [ "fatal", "error", "warning" ];

type LoaderRule = {
    // Must be kept in sync with SCHEMA.
    restricted: RegExp
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
                        description: `Regular expressions specifying which imports should be restricted.`,
                        instanceof: "RegExp",
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

export function run(loaderContext: webpack.loader.LoaderContext, source: string): string {
    const options = getOptions(loaderContext);
    validateOptions(SCHEMA, options, CONFIG);
    const rules: readonly LoaderRule[] = options.rules;
    const loaderSeverity: Severity = options.severity;
    const setParentNodes: boolean = defaultTo(true, options.detailedErrorMessages);
    const badImportMatrix = core.check({
        source: source,
        deciders: rules.map(r => r.restricted),
        fileName: loaderContext.resourcePath,
        setParentNodes: setParentNodes,
    });
    rules.forEach((rule, i) => {
        const badImports = badImportMatrix[i];
        if (badImports.length > 0) {
            const severity = rule.severity || loaderSeverity;
            const info = rule.info || DEFAULT.info;
            const message = errorMessageForAll(badImports, info, setParentNodes);
            const err = new Error(message);
            switch (severity) {
                case "fatal":
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
    return source;
}

function errorMessageForAll(imports: readonly core.ImportDetails[], info: string, setParentNodesWasUsed: boolean): string {
    return [
        info,
        "",
        indentBy(2)(imports.map(errorMessage(setParentNodesWasUsed)).join("")).trimRight(),
        "",
        "",
    ].join("\n");
}

function errorMessage(setParentNodesWasUsed: boolean): (i: core.ImportDetails) => string {
    return i => `• ${quote(i.path)}` + (setParentNodesWasUsed ? [
        `, imported here:`,
        ``,
        indentBy(6 /* bullet + space + 4 spaces */)(i.node.getText()),
        ``,
        ``,
        ``,
    ].join("\n") : "");
}
