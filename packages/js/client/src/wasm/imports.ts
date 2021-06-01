import {
  W3Imports,
  u32,
} from "./types";
import {
  readBytes,
  readString,
  writeBytes,
  writeString
} from "./utils";

export const imports = (memory: WebAssembly.Memory): W3Imports => ({
  w3: {
    __w3_subinvoke: (
      uriPtr: u32,
      uriLen: u32,
      modulePtr: u32,
      moduleLen: u32,
      methodPtr: u32,
      methodLen: u32,
      inputPtr: u32,
      inputLen: u32
    ): boolean => {

      const uri = readString(memory.buffer, uriPtr, uriLen);
      const module = readString(memory.buffer, modulePtr, moduleLen);
      const method = readString(memory.buffer, methodPtr, methodLen);
      const input = readBytes(memory.buffer, inputPtr, inputLen);

      // TODO: hasExport(asyncify_start_unwind)
      // TODO: asyncify_start_unwind

      const { data, error } = await client.invoke<
        unknown | ArrayBuffer
      >({
        uri: uri,
        module: module as InvokableModules,
        method: method,
        input: input,
      });

      if (!error) {
        let msgpack: ArrayBuffer;
        if (data instanceof ArrayBuffer) {
          msgpack = data;
        } else {
          msgpack = MsgPack.encode(data);
        }

        // TODO: handle the result (msgpack), probably store in state
      } else {
        const encoder = new TextEncoder();
        const bytes = encoder.encode(
          `${error.name}: ${error.message}`
        );

        // TODO: handle the error (bytes), probably store in state
      }

      // TODO: hasExport(asyncify_start_rewind)
      // TODO: asyncify_start_rewind()
    },
    // Give WASM the size of the result
    __w3_subinvoke_result_len: (): u32 => {
      if (!state.subinvoke.result) {
        abort("__w3_subinvoke_result_len: subinvoke.result is not set");
        return 0;
      }
      return state.subinvoke.result.byteLength;
    },
    // Copy the subinvoke result into WASM
    __w3_subinvoke_result: (ptr: u32): void => {
      if (!state.subinvoke.result) {
        abort("__w3_subinvoke_result: subinvoke.result is not set");
        return;
      }
      writeBytes(state.subinvoke.result, memory.buffer, ptr);
    },
    // Give WASM the size of the error
    __w3_subinvoke_error_len: (): u32 => {
      if (!state.subinvoke.error) {
        abort("__w3_subinvoke_error_len: subinvoke.error is not set");
        return 0;
      }
      return state.subinvoke.error.length;
    },
    // Copy the subinvoke error into WASM
    __w3_subinvoke_error: (ptr: u32): void => {
      if (!state.subinvoke.error) {
        abort("__w3_subinvoke_error: subinvoke.error is not set");
        return;
      }
      writeString(state.subinvoke.error, memory.buffer, ptr);
    },
    // Copy the invocation's method & args into WASM
    __w3_invoke_args: (methodPtr: u32, argsPtr: u32): void => {
      if (!state.method) {
        abort("__w3_invoke_args: method is not set");
        return;
      }
      if (!state.args) {
        abort("__w3_invoke_args: args is not set");
        return;
      }
      writeString(state.method, memory.buffer, methodPtr);
      writeBytes(state.args, memory.buffer, argsPtr);
    },
    // Store the invocation's result
    __w3_invoke_result: (ptr: u32, len: u32): void => {
      state.invoke.result = readBytes(memory.buffer, ptr, len);
    },
    // Store the invocation's error
    __w3_invoke_error: (ptr: u32, len: u32): void => {
      state.invoke.error = readString(memory.buffer, ptr, len);
    },
    __w3_abort: (
      msgPtr: u32,
      msgLen: u32,
      filePtr: u32,
      fileLen: u32,
      line: u32,
      column: u32
    ): void => {
      const msg = readString(memory.buffer, msgPtr, msgLen);
      const file = readString(memory.buffer, filePtr, fileLen);
      abort(`__w3_abort: ${msg}\nFile: ${file}\nLocation: [${line},${column}]`);
    },
  },
  env: {
    memory,
  },
});
