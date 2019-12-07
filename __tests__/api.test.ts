import * as ts from "typescript";
import * as webpack from "webpack";

import {
    LoaderDecider,
    ImportDetails,
    LoaderOptions,
    Severity,
    SyncDecider,
    check,
    everythingInPackage,
    everythingOutside,
} from "../src/index";
import loader from "../src/index";

it("exposes the intended API", () => {
    const severityFatal: Severity = "fatal";
    const severityError: Severity = "error";
    const severityWarning: Severity = "warning";
    const deciderRegex: SyncDecider = / /;
    const deciderFunction: SyncDecider = path => path.trim().length > 42;
    const deciderFunction_loader: LoaderDecider = (path, loaderContext) => Promise.resolve(loaderContext.resourcePath === "hello" || path.trim().length > 42);
    const importDetails: ImportDetails = {
        path: "",
        node: ts.createEmptyStatement(),
        line: 1,
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
                restricted: deciderFunction_loader,
                info: "",
            },
        ],
    };
    const decidersRegex: readonly SyncDecider[] = [ deciderRegex ];
    const decidersFunction: readonly SyncDecider[] = [ deciderFunction ];
    const checkedWithRegex: readonly (readonly ImportDetails[])[] = check({ source: "", restricted: decidersRegex });
    const checkedWithFunction: readonly (readonly ImportDetails[])[] = check({ source: "", restricted: decidersFunction });
    const checkedWithSetParentNodes: readonly (readonly ImportDetails[])[] = check({ source: "", restricted: decidersFunction, setParentNodes: false });
    const everythingInEmptyString: RegExp = everythingInPackage("");
    const everythingOutsideEmptyString: LoaderDecider = everythingOutside([""]);
});
