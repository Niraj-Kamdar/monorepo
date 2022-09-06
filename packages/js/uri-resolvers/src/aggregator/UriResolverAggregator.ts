import { UriResolverAggregatorBase } from "./UriResolverAggregatorBase";
import { UriResolverAggregatorOptions } from "./UriResolverAggregatorOptions";
import { InfiniteLoopError } from "../InfiniteLoopError";
import { UriResolverLike } from "../UriResolverLike";
import { buildUriResolver } from "../buildUriResolver";

import { Result, ResultOk } from "@polywrap/result";
import { IUriResolver, Uri, Client } from "@polywrap/core-js";

export type GetResolversFunc = (
  uri: Uri,
  client: Client
) => Promise<IUriResolver<unknown>[]>;

export type GetResolversWithErrorFunc<TError> = (
  uri: Uri,
  client: Client
) => Promise<Result<IUriResolver<unknown>[], TError | InfiniteLoopError>>;

export class UriResolverAggregator<
  TResolutionError = undefined,
  TGetResolversError = undefined
> extends UriResolverAggregatorBase<TResolutionError, TGetResolversError> {
  private resolvers:
    | IUriResolver<unknown>[]
    | GetResolversFunc
    | GetResolversWithErrorFunc<TGetResolversError>;

  constructor(
    resolvers: UriResolverLike[],
    options?: UriResolverAggregatorOptions
  );
  constructor(
    resolvers: (
      uri: Uri,
      client: Client
    ) => Promise<
      Result<IUriResolver<unknown>[], TGetResolversError | InfiniteLoopError>
    >,
    options?: UriResolverAggregatorOptions
  );
  constructor(
    resolvers: GetResolversFunc,
    options?: UriResolverAggregatorOptions
  );
  constructor(
    resolvers:
      | UriResolverLike[]
      | GetResolversFunc
      | GetResolversWithErrorFunc<TGetResolversError>,
    options: UriResolverAggregatorOptions = { fullResolution: false }
  ) {
    super(options.resolverName, options.fullResolution);
    if (Array.isArray(resolvers)) {
      this.resolvers = resolvers.map((x) => buildUriResolver(x));
    } else {
      this.resolvers = resolvers;
    }
  }

  async getUriResolvers(
    uri: Uri,
    client: Client
  ): Promise<
    Result<IUriResolver<unknown>[], TGetResolversError | InfiniteLoopError>
  > {
    if (Array.isArray(this.resolvers)) {
      return ResultOk(this.resolvers);
    } else {
      const result = await this.resolvers(uri, client);

      if (Array.isArray(result)) {
        return ResultOk(result);
      } else {
        return result;
      }
    }
  }
}
