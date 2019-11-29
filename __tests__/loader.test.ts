import * as webpack from "webpack";

import CONFIG_WITH from "./webpack.config";

describe("Loader", () => {
    jest.setTimeout(30000);

    it("should throw correctly", done => {
        compile(
            CONFIG_WITH({ entry: "main.ts", severity: "fatal" }),
            (stats, compilation) => {
                expect(stats.hasErrors()).toBe(true);
                expect(stats.hasWarnings()).toBe(false);
                expect(compilation.errors).toHaveLength(1);
                expect(compilation.warnings).toHaveLength(0);
                const firstError = compilation.errors[0];
                expect(firstError).toBeInstanceOf(Error);
                expect(firstError.name).toBe(`ModuleBuildError`);
                expect(firstError.message).toMatch(`"typescript"`);
                done();
            }
        );
    });

    it("should emit errors correctly", done => {
        compile(
            CONFIG_WITH({ entry: "main.ts", severity: "error" }),
            (stats, compilation) => {
                expect(stats.hasErrors()).toBe(true);
                expect(stats.hasWarnings()).toBe(false);
                expect(compilation.errors).toHaveLength(1);
                expect(compilation.warnings).toHaveLength(0);
                const firstError = compilation.errors[0];
                expect(firstError).toBeInstanceOf(Error);
                expect(firstError.name).toBe(`ModuleError`);
                expect(firstError.message).toMatch(`"typescript"`);
                done();
            }
        );
    });

    it("should emit warnings correctly", done => {
        compile(
            CONFIG_WITH({ entry: "main.ts", severity: "warning" }),
            (stats, compilation) => {
                expect(stats.hasErrors()).toBe(false);
                expect(stats.hasWarnings()).toBe(true);
                expect(compilation.errors).toHaveLength(0);
                expect(compilation.warnings).toHaveLength(1);
                const firstWarning = compilation.warnings[0];
                expect(firstWarning).toBeInstanceOf(Error);
                expect(firstWarning.name).toBe(`ModuleWarning`);
                expect(firstWarning.message).toMatch(`"typescript"`);
                done();
            }
        );
    });

    it("should handle the prioritizePerformance option correctly", done => {
        compile(
            CONFIG_WITH({ entry: "main.ts", severity: "error" }),
            (_, compilation) => {
                expect(compilation.errors[0].message).toMatch(`import * as _ from "typescript";`);
                done();
            }
        );
        compile(
            CONFIG_WITH({ entry: "main.ts", severity: "error", prioritizePerformance: false }),
            (_, compilation) => {
                expect(compilation.errors[0].message).toMatch(`import * as _ from "typescript";`);
                done();
            }
        );
        compile(
            CONFIG_WITH({ entry: "main.ts", severity: "error", prioritizePerformance: true }),
            (_, compilation) => {
                expect(compilation.errors[0].message).not.toMatch(`import * as _ from "typescript";`);
                done();
            }
        );
    });
});

function compile(
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
