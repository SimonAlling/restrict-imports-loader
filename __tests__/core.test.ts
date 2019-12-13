import { AsyncDeciderFunction } from "../src/core";
import { checkAsync, everythingInPackage } from "../src/index";

import { sourceFile } from "./utilities";

const RESTRICT = {
    typescript: [ everythingInPackage("typescript") ],
    typescript_lib: [ everythingInPackage("typescript/lib") ],
} as const;

const SOURCE = {
    different_import_kinds: sourceFile("different-import-kinds.ts"),
    minimal: sourceFile("minimal.ts"),
    submodules: sourceFile("submodules.ts"),
    prefixes: sourceFile("prefixes.ts"),
};

it("understands all import kinds", () => {
    checkAndExpect(SOURCE.different_import_kinds, RESTRICT.typescript, [[
        [ `typescript`, `import {} from "typescript";`                        ],
        [ `typescript`, `import * as typescriptStar from "typescript";`       ],
        [ `typescript`, `import typescriptDefault from "typescript";`         ],
        [ `typescript`, `import "typescript";`                                ],
        [ `typescript`, `import typescriptRequire = require("typescript");`   ],
        [ `typescript`, `export {} from "typescript";`                        ],
    ]]);
});

it("restricts submodules of restricted packages", () => {
    checkAndExpect(SOURCE.submodules, RESTRICT.typescript, [[
        [ `typescript`             , `import "typescript";`              ],
        [ `typescript/index`       , `import "typescript/index";`        ],
        [ `typescript/index.ts`    , `import "typescript/index.ts";`     ],
        [ `typescript/lib`         , `import "typescript/lib";`          ],
        [ `typescript/lib/index`   , `import "typescript/lib/index";`    ],
        [ `typescript/lib/index.ts`, `import "typescript/lib/index.ts";` ],
    ]]);
});

it("can restrict only submodules of packages", () => {
    checkAndExpect(SOURCE.submodules, RESTRICT.typescript_lib, [[
        [ `typescript/lib`         , `import "typescript/lib";`          ],
        [ `typescript/lib/index`   , `import "typescript/lib/index";`    ],
        [ `typescript/lib/index.ts`, `import "typescript/lib/index.ts";` ],
    ]]);
});

it("treats prefixes correctly", () => {
    checkAndExpect(SOURCE.prefixes, RESTRICT.typescript, [[
        [ `typescript`         , `import "typescript";`          ],
        [ `typescript/index`   , `import "typescript/index";`    ],
        [ `typescript/index.ts`, `import "typescript/index.ts";` ],
    ]]);
});

function checkAndExpect(source: string, deciders: readonly AsyncDeciderFunction[], expected: [string, string][][]): void {
    checkAsync({ source, deciders, fileName: "", setParentNodes: true }).then(output => {
        expect(output.map(items => items.map(item => [ item.path, item.node.getFullText().trim() ]))).toEqual(expected);
    })
}
