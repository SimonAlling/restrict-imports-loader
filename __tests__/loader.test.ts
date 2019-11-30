import * as webpack from "webpack";

import CONFIG_WITH from "./webpack.config";

const EXAMPLE_ERROR_MESSAGE = `\
Found restricted imports.

  • "typescript", imported here:

        import * as _ from "typescript";

`;

const EXAMPLE_ERROR_MESSAGE_MULTIPLE = `\
Found restricted imports.

  • "typescript", imported here:

        import * as _ from "typescript";


  • "typescript", imported here:

        import {} from "typescript";

`;

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

    it("should find errors in different files correctly", done => {
        compile(
            CONFIG_WITH({ entry: "main-different-files.ts", severity: "error" }),
            (stats, compilation) => {
                expect(stats.hasErrors()).toBe(true);
                expect(compilation.errors).toHaveLength(2);
                const firstError = compilation.errors[0];
                const secondError = compilation.errors[1];
                expect(firstError).toBeInstanceOf(Error);
                expect(secondError).toBeInstanceOf(Error);
                expect(firstError.name).toBe(`ModuleError`);
                expect(firstError.message).toMatch(`import * as tsInFunctions from "typescript";`);
                expect(secondError.name).toBe(`ModuleError`);
                expect(secondError.message).toMatch(`import * as tsInMain from "typescript";`);
                done();
            }
        );
    });

    it("should format error messages correctly", done => {
        compile(
            CONFIG_WITH({ entry: "main.ts", severity: "error" }),
            (_, compilation) => {
                const firstError = compilation.errors[0];
                const ourErrorMessage = withoutFirstLine(firstError.message as string);
                expect(ourErrorMessage).toEqual(EXAMPLE_ERROR_MESSAGE);
                done();
            }
        );
    });

    it("should format multiple errors from the same file correctly", done => {
        compile(
            CONFIG_WITH({ entry: "multiple.ts", severity: "error" }),
            (_, compilation) => {
                const firstError = compilation.errors[0];
                const ourErrorMessage = withoutFirstLine(firstError.message as string);
                expect(ourErrorMessage).toEqual(EXAMPLE_ERROR_MESSAGE_MULTIPLE);
                done();
            }
        );
    });

    it("should handle the detailedErrorMessages option correctly", done => {
        compile(
            CONFIG_WITH({ entry: "main.ts", severity: "error" }),
            (_, compilation) => {
                expect(compilation.errors[0].message).toMatch(`import * as _ from "typescript";`);
                done();
            }
        );
        compile(
            CONFIG_WITH({ entry: "main.ts", severity: "error", detailedErrorMessages: true }),
            (_, compilation) => {
                expect(compilation.errors[0].message).toMatch(`import * as _ from "typescript";`);
                done();
            }
        );
        compile(
            CONFIG_WITH({ entry: "main.ts", severity: "error", detailedErrorMessages: false }),
            (_, compilation) => {
                expect(compilation.errors[0].message).toMatch(`• "typescript"`);
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

function withoutFirstLine(s: string): string {
    return s.split("\n").slice(1).join("\n");
}
