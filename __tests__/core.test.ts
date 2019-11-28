import * as path from "path";
import * as fs from "fs";

import { Deciders, check, everythingIn } from "../src/index";

const RESTRICT = {
    typescript: [ everythingIn("typescript") ],
    typescript_lib: [ everythingIn("typescript/lib") ],
} as const;

const SOURCE = {
    different_import_kinds: sourceFile("different-import-kinds.ts"),
    minimal: sourceFile("minimal.ts"),
    submodules: sourceFile("submodules.ts"),
    prefixes: sourceFile("prefixes.ts"),
};

it("understands all import kinds", () => {
    expect(checkAndSummarize(SOURCE.different_import_kinds, RESTRICT.typescript)).toEqual([[
        [ `typescript`, `import {} from "typescript";`                        ],
        [ `typescript`, `import * as typescriptStar from "typescript";`       ],
        [ `typescript`, `import typescriptDefault from "typescript";`         ],
        [ `typescript`, `import "typescript";`                                ],
        [ `typescript`, `import typescriptRequire = require("typescript");`   ],
        [ `typescript`, `export {} from "typescript";`                        ],
    ]]);
});

it("restricts submodules of restricted packages", () => {
    expect(checkAndSummarize(SOURCE.submodules, RESTRICT.typescript)).toEqual([[
        [ `typescript`             , `import "typescript";`              ],
        [ `typescript/index`       , `import "typescript/index";`        ],
        [ `typescript/index.ts`    , `import "typescript/index.ts";`     ],
        [ `typescript/lib`         , `import "typescript/lib";`          ],
        [ `typescript/lib/index`   , `import "typescript/lib/index";`    ],
        [ `typescript/lib/index.ts`, `import "typescript/lib/index.ts";` ],
    ]]);
});

it("can restrict only submodules of packages", () => {
    expect(checkAndSummarize(SOURCE.submodules, RESTRICT.typescript_lib)).toEqual([[
        [ `typescript/lib`         , `import "typescript/lib";`          ],
        [ `typescript/lib/index`   , `import "typescript/lib/index";`    ],
        [ `typescript/lib/index.ts`, `import "typescript/lib/index.ts";` ],
    ]]);
});

it("treats prefixes correctly", () => {
    expect(checkAndSummarize(SOURCE.prefixes, RESTRICT.typescript)).toEqual([[
        [ `typescript`         , `import "typescript";`          ],
        [ `typescript/index`   , `import "typescript/index";`    ],
        [ `typescript/index.ts`, `import "typescript/index.ts";` ],
    ]]);
});

it("understands the setParentNodes option", () => {
    {
        const badImports = check({ source: SOURCE.minimal, restricted: RESTRICT.typescript, setParentNodes: true });
        expect(badImports[0][0].node.parent).toBeDefined();
    }
    {
        const badImports = check({ source: SOURCE.minimal, restricted: RESTRICT.typescript, setParentNodes: false });
        expect(badImports[0][0].node.parent).not.toBeDefined();
    }
});

it("defaults to true for setParentNodes", () => {
    const badImports = check({ source: SOURCE.minimal, restricted: RESTRICT.typescript });
    expect(badImports[0][0].node.parent).toBeDefined();
});

function checkAndSummarize(source: string, deciders: Deciders): readonly (readonly [string, string][])[] {
    return check({ source, restricted: deciders }).map(items => items.map(item => [ item.path, item.node.getFullText().trim() ]));
}

function sourceFile(name: string): string {
    return fs.readFileSync(path.resolve(__dirname, "src", name)).toString();
}
