import * as path from "path";
import { Severity, everythingIn } from "../src";
const NoEmitPlugin = require("no-emit-webpack-plugin");

const SRC_IN_TESTS = "src" as const;

export default (x: {
    severity: Severity,
    entry: string,
    detailedErrorMessages?: boolean,
}) => ({
    mode: "development" as const,
    entry: {
        "main": path.resolve(__dirname, SRC_IN_TESTS, x.entry),
    },
    context: path.join(__dirname, SRC_IN_TESTS),
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                include: path.resolve(__dirname, SRC_IN_TESTS),
                loaders: [
                    {
                        loader: "awesome-typescript-loader",
                        options: {
                            silent: true,
                            transpileOnly: true, // to speed up tests
                        },
                    },
                    {
                        loader: path.resolve(__dirname, "..", "src", "index.ts"),
                        options: {
                            severity: x.severity,
                            detailedErrorMessages: x.detailedErrorMessages,
                            rules: [
                                {
                                    restricted: everythingIn("typescript"),
                                },
                            ],
                        },
                    },
                ],
            },
        ],
    },
    plugins: [
        new NoEmitPlugin(), // to prevent files from being emitted in dist/
    ],
    resolve: {
        extensions: [ ".ts", ".tsx", ".mjs", ".js", ".jsx" ],
    },
});
