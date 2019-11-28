# restrict-imports-loader

A Webpack loader to restrict imports in ES and TypeScript.

## Installation

```
npm install --save-dev restrict-imports-loader
```

## Usage

**NOTE:** Only static imports are supported; see _Limitations_.

Configuration (`webpack.config.js`):

```javascript
module.exports = {
  // ...
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        include: path.resolve(__dirname, "src"), // example
        loaders: [
          {
            loader: "awesome-typescript-loader",
          },
          {
            loader: "restrict-imports-loader",
            options: {
              severity: "error",
              rules: [
                {
                  restricted: /^lodash$/,
                },
              ],
            },
          },
        ],
      },
    ],
  },
}
```

Source code (e.g. `index.ts`):

```typescript
import * as ts from "typescript"; // OK
import * as _ from "lodash"; // error
import * as fp from "lodash/fp"; // OK (see "Restrict Entire Package" for more info)
```


### Severity

You can control what happens if a restricted import is found by setting the `severity` option to either `"fatal"` (stop compilation), `"error"` (emit error) or `"warning"` (emit warning).
The severity level can be overridden for individual rules; see _Multiple Rules_.


### Multiple Rules

```javascript
{
  loader: "restrict-imports-loader",
  options: {
    severity: "error",
    rules: [
      {
        restricted: /^lodash$/,
        // inherits severity: "error"
      },
      {
        restricted: /^typescript$/,
        severity: "warning",
      },
    ],
  },
},
```


### Restrict Entire Package

If you want to restrict an entire package, including its submodules, you can use `everythingIn` for convenience and readability:

```javascript
const { everythingIn } = require("restrict-imports-loader");

module.exports = {
  // ...
  {
    loader: "restrict-imports-loader",
    options: {
      severity: "error",
      rules: [
        {
          restricted: everythingIn("lodash"),
        },
      ],
    },
  },
};
```

Code:

```typescript
import * as ts from "typescript"; // OK
import * as _ from "lodash"; // error
import * as fp from "lodash/fp"; // error
```



### Limitations

Only **static ES2015 (ES6) imports** are supported, for example:

  * `import {} from "typescript";`
  * `import * as ts from "typescript";`
  * `import ts from "typescript";`
  * `import "typescript";`
  * `export {} from "typescript";`
  * [`import ts = require("typescript");`](https://github.com/microsoft/TypeScript/blob/7cf6c70d90b60e962db417d80290288eb786b5fd/doc/spec.md#1133-import-require-declarations) _(works only in TypeScript)_

Dynamic imports are **not supported**:

  * `const ts = require("typescript");`
  * `const ts = import("typescript");`



## Contribute

```bash
npm install
npm run verify # build, lint and test
```
