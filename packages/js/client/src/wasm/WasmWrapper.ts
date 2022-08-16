/* eslint-disable @typescript-eslint/naming-convention */
import { WrapExports } from "./types";
import { createImports } from "./imports";

import {
  InvokeOptions,
  InvokeResult,
  InvocableResult,
  Wrapper,
  Uri,
  Client,
  combinePaths,
  Env,
  UriResolverInterface,
  GetFileOptions,
  GetManifestOptions,
  isBuffer,
} from "@polywrap/core-js";
import {
  deserializeWrapManifest,
  WrapManifest,
} from "@polywrap/wrap-manifest-types-js";
import { msgpackEncode } from "@polywrap/msgpack-js";
import { Tracer } from "@polywrap/tracing-js";
import { AsyncWasmInstance } from "@polywrap/asyncify-js";

type InvokeResultOrError =
  | { type: "InvokeResult"; invokeResult: Uint8Array }
  | { type: "InvokeError"; invokeError: string };

export interface State {
  method: string;
  args: Uint8Array;
  invoke: {
    result?: Uint8Array;
    error?: string;
  };
  subinvoke: {
    result?: Uint8Array;
    error?: string;
    args: unknown[];
  };
  subinvokeImplementation: {
    result?: Uint8Array;
    error?: string;
    args: unknown[];
  };
  invokeResult: InvokeResult;
  getImplementationsResult?: Uint8Array;
  env: Uint8Array;
}

export class WasmWrapper implements Wrapper {
  public static requiredExports: readonly string[] = ["_wrap_invoke"];

  private _info: WrapManifest | undefined = undefined;
  private _schema?: string;
  private _wasm: Uint8Array | undefined = undefined;

  constructor(
    public readonly uri: Uri,
    private _manifest: WrapManifest,
    private _uriResolver: string,
    private _clientEnv?: Env<Uri>
  ) {
    Tracer.startSpan("WasmWrapper: constructor");
    Tracer.setAttribute("args", {
      uri: this.uri,
      manifest: this._manifest,
      clientEnv: this._clientEnv,
      uriResolver: this._uriResolver,
    });
    Tracer.endSpan();
  }

  @Tracer.traceMethod("WasmWrapper: getFile")
  public async getFile(
    options: GetFileOptions,
    client: Client
  ): Promise<Uint8Array | string> {
    const { path, encoding } = options;
    const { data, error } = await UriResolverInterface.module.getFile(
      {
        invoke: <TData = unknown, TUri extends Uri | string = string>(
          options: InvokeOptions<TUri>
        ): Promise<InvokeResult<TData>> => client.invoke<TData, TUri>(options),
        invokeWrapper: <TData = unknown, TUri extends Uri | string = string>(
          options: InvokeOptions<TUri> & { wrapper: Wrapper }
        ): Promise<InvokeResult<TData>> =>
          client.invokeWrapper<TData, TUri>(options),
      },
      // TODO: support all types of URI resolvers (cache, etc)
      new Uri(this._uriResolver),
      combinePaths(this.uri.path, path)
    );

    if (error) {
      throw error;
    }

    // If nothing is returned, the file was not found
    if (!data) {
      throw Error(
        `WasmWrapper: File was not found.\nURI: ${this.uri}\nSubpath: ${path}`
      );
    }

    if (encoding) {
      const decoder = new TextDecoder(encoding);
      const text = decoder.decode(data);

      if (!text) {
        throw Error(
          `WasmWrapper: Decoding the file's bytes array failed.\nBytes: ${data}`
        );
      }
      return text;
    }
    return data;
  }

  @Tracer.traceMethod("WasmWrapper: getManifest")
  public async getManifest(
    options: GetManifestOptions,
    client: Client
  ): Promise<WrapManifest> {
    if (this._info !== undefined) {
      return this._info;
    }

    this._schema = (await this.getFile(
      {
        path: "schema.graphql",
        encoding: "utf-8",
      },
      client
    )) as string;

    const moduleManifest = "wrap.info";

    const data = (await this.getFile(
      { path: moduleManifest },
      client
    )) as Uint8Array;

    if (!data) {
      throw Error(`Package manifest does not contain information`);
    }
    return deserializeWrapManifest(data);
  }

  @Tracer.traceMethod("WasmWrapper: invoke")
  public async invoke(
    options: InvokeOptions<Uri>,
    client: Client
  ): Promise<InvocableResult<Uint8Array>> {
    try {
      const { method } = options;
      const args = options.args || {};
      const wasm = await this._getWasmModule(client);

      const state: State = {
        invoke: {},
        subinvoke: {
          args: [],
        },
        subinvokeImplementation: {
          args: [],
        },
        invokeResult: {} as InvokeResult,
        method,
        args: isBuffer(args) ? args : msgpackEncode(args),
        env: msgpackEncode(this._getClientEnv()),
      };

      const abort = (message: string) => {
        throw new Error(
          `WasmWrapper: Wasm module aborted execution.\nURI: ${this.uri.uri}\n` +
            `Method: ${method}\n` +
            `Args: ${JSON.stringify(args, null, 2)}\nMessage: ${message}.\n`
        );
      };

      const memory = AsyncWasmInstance.createMemory({ module: wasm });
      const instance = await AsyncWasmInstance.createInstance({
        module: wasm,
        imports: createImports({
          state,
          client,
          memory,
          abort,
        }),
        requiredExports: WasmWrapper.requiredExports,
      });

      const exports = instance.exports as WrapExports;

      const result = await exports._wrap_invoke(
        state.method.length,
        state.args.byteLength,
        state.env.byteLength
      );

      const invokeResult = this._processInvokeResult(state, result, abort);

      switch (invokeResult.type) {
        case "InvokeError": {
          throw Error(
            `WasmWrapper: invocation exception encountered.\n` +
              `uri: ${this.uri.uri}\n` +
              `method: ${method}\n` +
              `args: ${JSON.stringify(args, null, 2)}\n` +
              `exception: ${invokeResult.invokeError}`
          );
        }
        case "InvokeResult": {
          return {
            data: invokeResult.invokeResult,
            encoded: true,
          };
        }
        default: {
          throw Error(`WasmWrapper: Unknown state "${state}"`);
        }
      }
    } catch (error) {
      return {
        error,
      };
    }
  }

  @Tracer.traceMethod("WasmWrapper: getSchema")
  public async getSchema(client: Client): Promise<string> {
    if (this._schema) {
      return this._schema;
    }

    const schema = "schema.graphql";
    this._schema = (await this.getFile(
      { path: schema, encoding: "utf8" },
      client
    )) as string;

    return this._schema;
  }

  @Tracer.traceMethod("WasmWrapper: _processInvokeResult")
  private _processInvokeResult(
    state: State,
    result: boolean,
    abort: (message: string) => never
  ): InvokeResultOrError {
    if (result) {
      if (!state.invoke.result) {
        abort("Invoke result is missing.");
      }

      return {
        type: "InvokeResult",
        invokeResult: state.invoke.result,
      };
    } else {
      if (!state.invoke.error) {
        abort("Invoke error is missing.");
      }

      return {
        type: "InvokeError",
        invokeError: state.invoke.error,
      };
    }
  }

  @Tracer.traceMethod("WasmWrapper: _getClientEnv")
  private _getClientEnv(): Record<string, unknown> {
    if (!this._clientEnv?.env) {
      return {};
    }
    return this._clientEnv.env;
  }

  @Tracer.traceMethod("WasmWrapper: getWasmModule")
  private async _getWasmModule(client: Client): Promise<Uint8Array> {
    if (this._wasm !== undefined) {
      return this._wasm;
    }

    const moduleManifest = "wrap.wasm";

    if (!moduleManifest) {
      throw Error(`Package manifest does not contain a definition for module`);
    }

    const data = (await this.getFile(
      { path: moduleManifest },
      client
    )) as Uint8Array;

    this._wasm = data;
    return data;
  }
}
