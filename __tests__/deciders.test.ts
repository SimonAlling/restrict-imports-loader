import * as path from "path";

import { compile } from "./utilities";
import CONFIG_WITH from "./webpack.config";
import * as deciders from "../src/deciders";

describe("Deciders", () => {
    jest.setTimeout(30000);

    it("should restrict imports correctly with everythingOutside", done => {
        compile(
            CONFIG_WITH({
                entry: "relative.ts",
                severity: "error",
                restricted: deciders.everythingOutside([
                    path.resolve(__dirname, "src"),
                    path.resolve(__dirname, "..", "node_modules"),
                ]),
            }),
            (stats, compilation) => {
                expect(stats.hasErrors()).toBe(true);
                expect(compilation.errors).toHaveLength(1);
                const firstError = compilation.errors[0];
                expect(firstError).toBeInstanceOf(Error);
                expect(firstError.name).toBe(`ModuleError`);
                expect(firstError.message.match(/•/g)).toHaveLength(2);
                expect(firstError.message).toMatch(`import * as coretest1 from "../core.test";`);
                expect(firstError.message).toMatch(`import * as coretest2 from "./../core.test";`);
                expect(firstError.message).not.toMatch(`import * as functions1 from "./functions";`);
                expect(firstError.message).not.toMatch(`import * as functions2 from "../src/functions";`);
                expect(firstError.message).not.toMatch(`import * as typescript from "typescript";`);
                done();
            }
        );
    });

    it("should restrict imports correctly with everythingInside", done => {
        compile(
            CONFIG_WITH({
                entry: "relative.ts",
                severity: "error",
                restricted: deciders.everythingInside([
                    path.resolve(__dirname, "src"),
                    path.resolve(__dirname, "..", "node_modules"),
                ]),
            }),
            (stats, compilation) => {
                expect(stats.hasErrors()).toBe(true);
                expect(compilation.errors).toHaveLength(1);
                const firstError = compilation.errors[0];
                expect(firstError).toBeInstanceOf(Error);
                expect(firstError.name).toBe(`ModuleError`);
                expect(firstError.message.match(/•/g)).toHaveLength(3);
                expect(firstError.message).toMatch(`import * as functions1 from "./functions";`);
                expect(firstError.message).toMatch(`import * as functions2 from "../src/functions";`);
                expect(firstError.message).toMatch(`import * as typescript from "typescript";`);
                expect(firstError.message).not.toMatch(`import * as coretest1 from "../core.test";`);
                expect(firstError.message).not.toMatch(`import * as coretest2 from "./../core.test";`);
                done();
            }
        );
    });

    it("should restrict imports correctly with climbingUpwardsMoreThan", done => {
        compile(
            CONFIG_WITH({
                entry: "climbing-upwards.ts",
                severity: "error",
                restricted: deciders.climbingUpwardsMoreThan(1),
            }),
            (stats, compilation) => {
                expect(stats.hasErrors()).toBe(true);
                expect(compilation.errors).toHaveLength(1);
                const firstError = compilation.errors[0];
                expect(firstError).toBeInstanceOf(Error);
                expect(firstError.name).toBe(`ModuleError`);
                expect(firstError.message.match(/•/g)).toHaveLength(8);
                expect(firstError.message).toMatch(`import {} from "../../src";`);
                expect(firstError.message).toMatch(`import {} from "./../../src";`);
                expect(firstError.message).toMatch(`import {} from "../../src/loader";`);
                expect(firstError.message).toMatch(`import {} from ".././../src/loader";`);
                expect(firstError.message).toMatch(`import {} from "./.././../src/loader";`);
                expect(firstError.message).toMatch(`import {} from "../../__tests__/src/functions";`);
                expect(firstError.message).toMatch(`import {} from "../src/../../__tests__/src/functions";`);
                expect(firstError.message).toMatch(`import {} from "typescript/lib/../../typescript/lib/typescript";`);
                expect(firstError.message).not.toMatch(`import {} from "typescript";`);
                expect(firstError.message).not.toMatch(`import {} from "./functions";`);
                expect(firstError.message).not.toMatch(`import {} from "../webpack.config";`);
                expect(firstError.message).not.toMatch(`import {} from "./../webpack.config";`);
                expect(firstError.message).not.toMatch(`import {} from "../src/functions";`);
                done();
            }
        );
    });
});
