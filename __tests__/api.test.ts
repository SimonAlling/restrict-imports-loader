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
    const minimalLoaderOptions: LoaderOptions = {
        severity: severityError,
        rules: [
            {
                restricted: deciderRegex,
            },
        ],
    };
    const loaderOptions: LoaderOptions = {
        severity: severityError,
        detailedErrorMessages: false,
        rules: [
            {
                severity: severityFatal,
                restricted: deciderRegex,
                info: "",
            },
            {
                // severity should be optional here
                restricted: deciderRegex,
                // info should be optional here
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
    const checkedWithRegex: readonly (readonly ImportDetails[])[] = check({ source: "", restricted: decidersRegex });
    const checkedWithFunction: readonly (readonly ImportDetails[])[] = check({ source: "", restricted: decidersFunction });
    const checkedWithSetParentNodes: readonly (readonly ImportDetails[])[] = check({ source: "", restricted: decidersFunction, setParentNodes: false });
    const everythingInEmptyString: RegExp = everythingIn("");
});
