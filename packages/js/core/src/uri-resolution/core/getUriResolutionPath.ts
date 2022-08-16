import { IUriResolutionStep } from ".";
import { Uri } from "../..";

export const getUriResolutionPath = (
  history: IUriResolutionStep<unknown>[]
): IUriResolutionStep<unknown>[] => {
  return history.filter((x) => {
    let resultUri: Uri | undefined;
    if (!x.result.response.ok) {
      return true;
    }

    const uriPackageOrWrapper = x.result.response.value;

    if (uriPackageOrWrapper.type === "uri") {
      resultUri = uriPackageOrWrapper.uri;
    } else if (uriPackageOrWrapper.type === "package") {
      resultUri = uriPackageOrWrapper.package?.uri;
    } else if (uriPackageOrWrapper.type === "wrapper") {
      resultUri = uriPackageOrWrapper.wrapper.uri;
    }

    return !resultUri || resultUri.uri !== x.sourceUri.uri;
  });
};
