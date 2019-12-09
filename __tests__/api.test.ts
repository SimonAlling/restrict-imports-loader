import * as ts from "typescript";
import * as webpack from "webpack";

import {
    LoaderDecider,
    RestrictedImportDetails,
    LoaderOptions,
    Severity,
    AsyncDecider,
    checkAsync,
    everythingInPackage,
    everythingOutside,
    everythingInside,
    matchedBy,
} from "../src/index";
import loader from "../src/index";

it("exposes the intended API", () => {
    const severityFatal: Severity = "fatal";
    const severityError: Severity = "error";
    const severityWarning: Severity = "warning";
    const deciderRegex: AsyncDecider = / /;
    const deciderFunction: AsyncDecider = async path => {
        const l = path.trim().length;
        return { restricted: l > 42, info: `Length is ${l}.` };
    };
    const deciderFunction_loader: LoaderDecider = (path, loaderContext) => Promise.resolve({
        restricted: loaderContext.resourcePath === "hello" || path.trim().length > 42,
        info: "",
    });
    const restrictedImportDetails: RestrictedImportDetails = {
        path: "",
        node: ts.createEmptyStatement(),
        line: 1,
        info: "",
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
    const checkedWithRegex: Promise<readonly (readonly RestrictedImportDetails[])[]> = checkAsync({ source: "", deciders: [ matchedBy(deciderRegex) ], fileName: "", setParentNodes: false });
    const checkedWithFunction: Promise<readonly (readonly RestrictedImportDetails[])[]> = checkAsync({ source: "", deciders: [ deciderFunction ], fileName: "", setParentNodes: true });
    const everythingInPackageEmptyString: LoaderDecider = everythingInPackage("");
    const everythingOutsideEmptyString: LoaderDecider = everythingOutside([""]);
    const everythingInsideEmptyString: LoaderDecider = everythingInside([""]);
});
