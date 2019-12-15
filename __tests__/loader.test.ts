import * as path from "path";

import { compile, withoutFirstLine } from "./utilities";
import CONFIG_WITH from "./webpack.config";
import * as deciders from "../src/deciders";

const EXAMPLE_ERROR_MESSAGE_WITH_DETAILS = `\
Found restricted imports:

  • "typescript", imported on line 1:

        import * as _ from "typescript";


  • "typescript", imported on line 2:

        import {} from "typescript";

`;

const EXAMPLE_ERROR_MESSAGE_WITHOUT_DETAILS = `\
Found restricted imports:

  • "typescript", imported on line 1
  • "typescript", imported on line 2

`;

const EXAMPLE_ERROR_MESSAGE_WITH_NON_OBVIOUS_LINE_NUMBERS = `\
Found restricted imports:

  • "typescript", imported on line 3:

        import {} from "typescript";


  • "typescript", imported on line 7:

        import {

        } from "typescript";

`;

const EXAMPLE_ERROR_MESSAGE_WITH_INFO = `\
Found restricted imports:

  • "./functions", imported on line 4:

        import * as functions1 from "./functions";

    (resolved: ${path.resolve(__dirname, "src", "functions.ts")})


  • "../src/functions", imported on line 5:

        import * as functions2 from "../src/functions";

    (resolved: ${path.resolve(__dirname, "src", "functions.ts")})


  • "typescript", imported on line 7:

        import * as typescript from "typescript";

    (resolved: ${path.resolve(__dirname, "..", "node_modules", "typescript", "lib", "typescript.js")})

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

    it("should understand a function for the `restricted` option", done => {
        compile(
            CONFIG_WITH({
                entry: "minimal.ts",
                severity: "error",
                restricted: importPath => Promise.resolve({ restricted: importPath === "typescript" }),
            }),
            (stats, compilation) => {
                expect(stats.hasErrors()).toBe(true);
                expect(compilation.errors).toHaveLength(1);
                const firstError = compilation.errors[0];
                expect(firstError).toBeInstanceOf(Error);
                expect(firstError.name).toBe(`ModuleError`);
                expect(firstError.message).toMatch(`import "typescript";`);
                done();
            }
        );
    });

    it("should restrict relative imports correctly", done => {
        compile(
            CONFIG_WITH({
                entry: "relative.ts",
                severity: "error",
                restricted: (importPath, loaderContext) => new Promise((resolve, reject) => {
                    loaderContext.resolve(loaderContext.context, importPath, (err, result) => {
                        if (err === null) {
                            resolve({ restricted: false === result.startsWith(loaderContext.rootContext) });
                        } else {
                            reject(err.message);
                        }
                    });
                }),
            }),
            (stats, compilation) => {
                expect(stats.hasErrors()).toBe(true);
                expect(compilation.errors).toHaveLength(1);
                const firstError = compilation.errors[0];
                expect(firstError).toBeInstanceOf(Error);
                expect(firstError.name).toBe(`ModuleError`);
                expect(firstError.message.match(/•/g)).toHaveLength(3);
                expect(firstError.message).toMatch(`import * as coretest1 from "../core.test";`);
                expect(firstError.message).toMatch(`import * as coretest2 from "./../core.test";`);
                expect(firstError.message).toMatch(`import * as typescript from "typescript";`);
                expect(firstError.message).not.toMatch(`import * as functions1 from "./functions";`);
                expect(firstError.message).not.toMatch(`import * as functions2 from "../src/functions";`);
                done();
            }
        );
    });

    it("should format error messages correctly", done => {
        compile(
            CONFIG_WITH({ entry: "multiple.ts", severity: "error" }),
            (_, compilation) => {
                const firstError = compilation.errors[0];
                const ourErrorMessage = withoutFirstLine(firstError.message as string);
                expect(ourErrorMessage).toEqual(EXAMPLE_ERROR_MESSAGE_WITH_DETAILS);
                done();
            }
        );
    });

    it("should format error messages without details correctly", done => {
        compile(
            CONFIG_WITH({ entry: "multiple.ts", severity: "error", detailedErrorMessages: false }),
            (_, compilation) => {
                const firstError = compilation.errors[0];
                const ourErrorMessage = withoutFirstLine(firstError.message as string);
                expect(ourErrorMessage).toEqual(EXAMPLE_ERROR_MESSAGE_WITHOUT_DETAILS);
                done();
            }
        );
    });

    it("should format error messages correctly with respect to line numbers", done => {
        compile(
            CONFIG_WITH({ entry: "line-numbers.ts", severity: "error", detailedErrorMessages: true }),
            (_, compilation) => {
                const firstError = compilation.errors[0];
                const ourErrorMessage = withoutFirstLine(firstError.message as string);
                expect(ourErrorMessage).toEqual(EXAMPLE_ERROR_MESSAGE_WITH_NON_OBVIOUS_LINE_NUMBERS);
                done();
            }
        );
    });

    it("should format error messages with info correctly", done => {
        const restricted = deciders.everythingInside([
            path.resolve(__dirname, "..", "node_modules"),
            path.resolve(__dirname, "src"),
        ]);
        compile(
            CONFIG_WITH({ entry: "relative.ts", severity: "error", detailedErrorMessages: true, restricted: restricted }),
            (_, compilation) => {
                expect(compilation.errors).toHaveLength(1);
                const firstError = compilation.errors[0];
                const ourErrorMessage = withoutFirstLine(firstError.message as string);
                expect(ourErrorMessage).toEqual(EXAMPLE_ERROR_MESSAGE_WITH_INFO);
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
