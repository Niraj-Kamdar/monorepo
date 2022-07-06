/* eslint-disable */
/**
 * This file was automatically generated by scripts/manifest/migrate-ts.mustache.
 * DO NOT MODIFY IT BY HAND. Instead, modify scripts/manifest/migrate-ts.mustache,
 * and run node ./scripts/manifest/generateFormatTypes.js to regenerate this file.
 */
import {
  AnyInfraManifest,
  InfraManifest,
  InfraManifestFormats,
  latestInfraManifestFormat
} from ".";


type Migrator = {
  [key in InfraManifestFormats]?: (m: AnyInfraManifest) => InfraManifest;
};

export const migrators: Migrator = {
};

export function migrateInfraManifest(
  manifest: AnyInfraManifest,
  to: InfraManifestFormats
): InfraManifest {
  const from = manifest.format as InfraManifestFormats;

  if (from === latestInfraManifestFormat) {
    return manifest as InfraManifest;
  }

  if (!(from in InfraManifestFormats)) {
    throw new Error(`Unrecognized InfraManifestFormat "${manifest.format}"`);
  }

  throw new Error(`This should never happen, InfraManifest migrators is empty. from: ${from}, to: ${to}`);
}