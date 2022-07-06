/* eslint-disable */
/**
 * This file was automatically generated by scripts/manifest/migrate-ts.mustache.
 * DO NOT MODIFY IT BY HAND. Instead, modify scripts/manifest/migrate-ts.mustache,
 * and run node ./scripts/manifest/generateFormatTypes.js to regenerate this file.
 */
import {
  AnyDeployManifest,
  DeployManifest,
  DeployManifestFormats,
  latestDeployManifestFormat
} from ".";


type Migrator = {
  [key in DeployManifestFormats]?: (m: AnyDeployManifest) => DeployManifest;
};

export const migrators: Migrator = {
};

export function migrateDeployManifest(
  manifest: AnyDeployManifest,
  to: DeployManifestFormats
): DeployManifest {
  const from = manifest.format as DeployManifestFormats;

  if (from === latestDeployManifestFormat) {
    return manifest as DeployManifest;
  }

  if (!(from in DeployManifestFormats)) {
    throw new Error(`Unrecognized DeployManifestFormat "${manifest.format}"`);
  }

  throw new Error(`This should never happen, DeployManifest migrators is empty. from: ${from}, to: ${to}`);
}