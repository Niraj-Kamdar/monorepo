import {
  w3_add_invoke,
  w3_invoke,
  w3_abort,
  __w3_load_env
} from "@web3api/wasm-as";
import {
  mutationMethodWrapped,
  objectMethodWrapped
} from "./Mutation/wrapped";
import {
  env
} from "./environment";
import {
  MutationEnv
} from "./MutationEnv";

export function _w3_init(): void {
  w3_add_invoke("mutationMethod", mutationMethodWrapped);
  w3_add_invoke("objectMethod", objectMethodWrapped);
}

export function _w3_load_env(environment_size: u32): void {
  const environmentBuf = new ArrayBuffer(environment_size);
  __w3_load_env(changetype<u32>(environmentBuf));

  env = MutationEnv.fromBuffer(environmentBuf);
}

export function _w3_invoke(method_size: u32, args_size: u32): bool {
  return w3_invoke(method_size, args_size);
}

export function w3Abort(
  msg: string | null,
  file: string | null,
  line: u32,
  column: u32
): void {
  w3_abort(
    msg ? msg : "",
    file ? file : "",
    line,
    column
  );
}
