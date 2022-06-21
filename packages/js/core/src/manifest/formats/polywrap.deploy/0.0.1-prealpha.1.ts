/* eslint-disable @typescript-eslint/naming-convention */
/* tslint:disable */
/**
 * This file was automatically generated by json-schema-to-typescript.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run json-schema-to-typescript to regenerate this file.
 */

export interface DeployManifest {
  /**
   * Polywrap deployment manifest format version.
   */
  format: "0.0.1-prealpha.1";
  stages: {
    /**
     * Deployment stage.
     *
     * This interface was referenced by `undefined`'s JSON-Schema definition
     * via the `patternProperty` "^.*$".
     */
    [k: string]: {
      /**
       * Name of the deploy stage.
       */
      package: string;
      /**
       * Custom configuration.
       */
      config?: {
        [k: string]: unknown;
      };
      /**
       * Name of dependent stages.
       */
      depends_on?: string;
      /**
       * URI to pass into the deploy stage.
       */
      uri?: string;
    };
  };
  __type: "DeployManifest";
}
