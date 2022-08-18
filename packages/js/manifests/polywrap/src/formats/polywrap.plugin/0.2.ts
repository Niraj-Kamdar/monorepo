/* eslint-disable @typescript-eslint/naming-convention */
/* tslint:disable */
/**
 * This file was automatically generated by json-schema-to-typescript.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run json-schema-to-typescript to regenerate this file.
 */

export interface PluginManifest {
  /**
   * Polywrap plugin manifest format version.
   */
  format: "0.2";
  /**
   * Plugin name.
   */
  name: string;
  /**
   * Plugin language.
   */
  language: string;
  /**
   * Path to Polywrap implementation.
   */
  module?: string;
  /**
   * Path to graphql schema.
   */
  schema: string;
  /**
   * Specify ABIs to be used for the import URIs within your schema.
   */
  import_abis?: ImportAbis[];
  __type: "PluginManifest";
}
export interface ImportAbis {
  /**
   * One of the schema's import URI.
   */
  uri: string;
  /**
   * Path to a local ABI (or schema). Supported file formats: [*.graphql, *.info, *.json, *.yaml]
   */
  abi: string;
}