import * as fs from "fs";
import * as path from "path";

export function sourceFile(name: string): string {
    return fs.readFileSync(path.resolve(__dirname, "src", name)).toString();
}
