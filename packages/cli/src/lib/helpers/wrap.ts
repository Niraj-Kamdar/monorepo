import { Logger, logActivity } from "../logging";
import { intlMsg } from "../intl";
import { displayPath } from "../system";

import {
  serializeWrapManifest,
  latestWrapManifestVersion,
  WrapManifest,
  WrapAbi,
} from "@polywrap/wrap-manifest-types-js";
import { normalizePath, writeFileSync } from "@polywrap/os-js";

export const supportedWrapTypes: WrapManifest["type"][] = [
  "interface",
  "wasm",
  "plugin",
];

const run = async (
  abi: WrapAbi,
  name: string,
  type: WrapManifest["type"],
  path: string
): Promise<void> => {
  const manifest: WrapManifest = {
    version: latestWrapManifestVersion,
    name,
    type,
    abi,
  };

  const bytes = await serializeWrapManifest(manifest);

  writeFileSync(path, bytes, { encoding: "binary" });
};

export const generateWrapFile = async (
  abi: WrapAbi,
  name: string,
  type: string,
  path: string,
  logger: Logger
): Promise<void> => {
  if (supportedWrapTypes.indexOf(type as WrapManifest["type"]) === -1) {
    throw Error(intlMsg.lib_helpers_wrap_unsupportedType({ type }));
  }

  const wrapType = type as WrapManifest["type"];

  const relativePath = displayPath(path);
  return await logActivity(
    logger,
    intlMsg.lib_helpers_manifest_outputText({
      path: normalizePath(relativePath),
    }),
    intlMsg.lib_helpers_manifest_outputError({
      path: normalizePath(relativePath),
    }),
    intlMsg.lib_helpers_manifest_outputWarning({
      path: normalizePath(relativePath),
    }),
    async (): Promise<void> => {
      await run(abi, name, wrapType, path);
    }
  );
};
