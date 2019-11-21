import * as path from "path";
import { Severity, everythingIn } from "../src";

const SRC_IN_TESTS = "src" as const;

export default (x: {
    severity: Severity,
    entry: string,
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
                        },
                    },
                    {
                        loader: path.resolve(__dirname, "..", "src", "index.ts"),
                        options: {
                            severity: x.severity,
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
    resolve: {
        extensions: [ ".ts", ".tsx", ".mjs", ".js", ".jsx" ],
    },
});
