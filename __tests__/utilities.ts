import * as fs from "fs";
import * as path from "path";
import * as webpack from "webpack";

export function sourceFile(name: string): string {
    return fs.readFileSync(path.resolve(__dirname, "src", name)).toString();
}

export function compile(
    config: webpack.Configuration,
    callback: (stats: webpack.Stats, compilation: webpack.compilation.Compilation) => void,
) {
    const compiler = (
        // Only way I've been able to get both typechecking and actual code to work:
        (webpack as any).default(config) as webpack.Compiler
    );
    compiler.run((err: Error | null, stats: webpack.Stats) => {
        if (err) throw err;
        callback(stats, stats.compilation);
    });
}

export function withoutFirstLine(s: string): string {
    return s.split("\n").slice(1).join("\n");
}
