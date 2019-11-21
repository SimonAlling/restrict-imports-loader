import { getOptions } from "loader-utils";
import validateOptions from "schema-utils";
import * as webpack from "webpack";

import * as core from "./core";
import { indentBy, quote } from "./text";

const DEFAULT = {
    info: `Found restricted imports.`,
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
    severity: Severity
    rules: readonly LoaderRule[]
};

// `as const` assertions are necessary because `as const` on entire schema does not typecheck and the type of a string literal is inferred as string by default.
const SCHEMA = {
    // Must be kept in sync with LoaderOptions type.
    type: "object" as const,
    required: [ "rules", "severity" ],
    properties: {
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
    const badImportMatrix = core.check({
        source: source,
        deciders: rules.map(r => r.restricted),
        fileName: loaderContext.resourcePath,
    });
    rules.forEach((rule, i) => {
        const badImports = badImportMatrix[i];
        if (badImports.length > 0) {
            const severity = rule.severity || loaderSeverity;
            const info = rule.info || DEFAULT.info;
            const message = errorMessageForAll(badImports, info);
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
                    // Enforce exhaustiveness:
                    const _: never = severity; void _; // tslint:disable-line:no-unused-expression
            }
        }
    });
    return source;
}

function errorMessageForAll(imports: readonly core.ImportDetails[], info: string): string {
    return [
        info,
        "",
        indentBy(2)(imports.map(errorMessage).join("")).trimRight(),
        "",
        "",
    ].join("\n");
}

function errorMessage(i: core.ImportDetails): string {
    return [
        `• ${quote(i.path)}, imported here:`,
        ``,
        indentBy(6 /* bullet + space + 4 spaces */)(i.node.getFullText().trim()),
        ``,
        ``,
        ``,
    ].join("\n");
}
