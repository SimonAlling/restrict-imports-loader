import * as ts from "typescript";
import * as webpack from "webpack";

import {
    Decider,
    Deciders,
    ImportDetails,
    LoaderOptions,
    Severity,
    check,
    everythingIn,
} from "../src/index";
import loader from "../src/index";

it("exposes the intended API", () => {
    const severityFatal: Severity = "fatal";
    const severityError: Severity = "error";
    const severityWarning: Severity = "warning";
    const deciderRegex: Decider = / /;
    const deciderFunction: Decider = path => path.trim().length > 42;
    const importDetails: ImportDetails = {
        path: "",
        node: ts.createEmptyStatement(),
    };
    const loaderOptions: LoaderOptions = {
        severity: severityError,
        rules: [
            {
                severity: severityFatal,
                restricted: deciderRegex,
                info: "",
            },
            {
                // severity should be optional here
                restricted: deciderRegex,
                info: "",
            },
            {
                severity: severityWarning,
                restricted: deciderRegex,
                info: "",
            },
        ],
    };
    const decidersRegex: Deciders = [ deciderRegex ];
    const decidersFunction: Deciders = [ deciderFunction ];
    const checkedWithRegex: readonly (readonly ImportDetails[])[] = check("", decidersRegex);
    const checkedWithFunction: readonly (readonly ImportDetails[])[] = check("", decidersFunction);
    const everythingInEmptyString: RegExp = everythingIn("");
});
