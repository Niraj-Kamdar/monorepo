/* eslint-disable @typescript-eslint/naming-convention */
/* tslint:disable */
/**
 * This file was automatically generated by json-schema-to-typescript.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run json-schema-to-typescript to regenerate this file.
 */

/**
 * Docker image strategy configuration
 */
export type Image = (ImageAssemblyscript | ImageRust) & {
  /**
   * Docker image name.
   */
  name?: string;
  /**
   * Docker image file name.
   */
  dockerfile?: string;
  /**
   * Configuration options for Docker Buildx, set to true for default value.
   */
  buildx?:
    | {
        /**
         * Path to cache directory, set to true for default value, set to false to disable caching.
         */
        cache?: string | boolean;
        /**
         * Remove the builder instance.
         */
        removeBuilder?: boolean;
      }
    | boolean;
  /**
   * Remove the image.
   */
  removeImage?: boolean;
};

export interface BuildManifest {
  /**
   * Polywrap build manifest format version.
   */
  format: "0.2.0" | "0.2";
  /**
   * Custom build image configurations.
   */
  strategies?: {
    image?: Image;
    local?: Local;
    vm?: Vm;
  };
  /**
   * Locally linked packages into docker build image.
   */
  linked_packages?: {
    /**
     * Package name.
     */
    name: string;
    /**
     * Path to linked package directory.
     */
    path: string;
    /**
     * Ignore files matching this regex in linked package directory.
     */
    filter?: string;
  }[];
  /**
   * General configurations.
   */
  config?: {
    [k: string]: unknown;
  };
  __type: "BuildManifest";
}
export interface ImageAssemblyscript {
  /**
   * Docker image's node version.
   */
  node_version: string;
  /**
   * Files to include in docker image.
   */
  include: string[];
}
export interface ImageRust {
  /**
   * Files to include in docker image.
   */
  include: string[];
}
/**
 * Local build strategy configuration
 */
export interface Local {
  /**
   * Custom script path for local build
   */
  scriptPath?: string;
}
/**
 * Docker VM strategy configuration
 */
export interface Vm {
  /**
   * Base image for the Docker VM
   */
  baseImage?: string;
  /**
   * Files to include in build VM container, by default
   */
  defaultIncludes?: string[];
}
