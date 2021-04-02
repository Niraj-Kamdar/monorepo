import { Ethereum_Query } from "./w3/imported";
import { fetchTokenData } from "./fetch";
import { tokenEquals, tokenSortsBefore } from "./token";
import { FACTORY_ADDRESS, MINIMUM_LIQUIDITY } from "./index";
import { BigInt } from "../utils/BigInt";
import {
  Input_pairAddress, Input_pairInputAmount,
  Input_pairLiquidityMinted,
  Input_pairLiquidityToken,
  Input_pairLiquidityValue,
  Input_pairOutputAmount, Input_pairReserves,
  Pair, Token,
  TokenAmount
} from "./w3";

// TODO: this can be calculated off-chain with keccack256
// returns address of pair liquidity token contract
export function pairAddress(input: Input_pairAddress): string {
  const token0: string = input.token0.address;
  const token1: string = input.token1.address;
  return Ethereum_Query.callView({
    address: FACTORY_ADDRESS,
    method: "function getPair(address tokenA, address tokenB) external view returns (address pair)",
    args: [token0, token1],
    // network: resolveChainId(token0.chainId)
  });
}

// returns pair liquidity token
export function pairLiquidityToken(input: Input_pairLiquidityToken): Token {
  const pair: Pair = input.pair;
  const token0: Token = pair.tokenAmount0.token;
  const token1: Token = pair.tokenAmount1.token;
  return fetchTokenData({
    chainId: token0.chainId,
    address: pairAddress({token0, token1}),
    symbol: null,
    name: null
  });
}

// returns the reserve of token0
// TODO: pairReserve0 seems unnecessary. Remove?
export function pairReserves(input: Input_pairReserves): string[] {
  const pair: Pair = input.pair;
  return [pair.tokenAmount0.amount, pair.tokenAmount1.amount];
}

// Pricing function for exact input amounts. Returns maximum output amount, based on current reserves, if the trade were executed.
export function pairOutputAmount(input: Input_pairOutputAmount): TokenAmount {
  const pair: Pair = input.pair;
  const tradeTokenAmount: TokenAmount = input.inputAmount;
  const tradeAmount = BigInt.fromString(tradeTokenAmount.amount);
  if (tradeAmount.eq(BigInt.ZERO)) {
    throw new RangeError("Insufficient input amount: Input amount must be greater than zero");
  }
  if (BigInt.fromString(pair.tokenAmount0.amount).eq(BigInt.ZERO) || BigInt.fromString(pair.tokenAmount1.amount).eq(BigInt.ZERO)) {
    throw new RangeError("Insufficient liquidity: Pair reserves must be greater than zero")
  }
  let inTokenAmount: TokenAmount;
  let outTokenAmount: TokenAmount;
  if (tokenEquals({ token: pair.tokenAmount0.token, other: tradeTokenAmount.token })) {
    inTokenAmount = pair.tokenAmount0;
    outTokenAmount = pair.tokenAmount1;
  }  else {
    inTokenAmount = pair.tokenAmount1;
    outTokenAmount = pair.tokenAmount0;
  }
  const amountInWithFee: BigInt = tradeAmount.mul(BigInt.fromString("997"));
  const numerator: BigInt = amountInWithFee.mul(BigInt.fromString(outTokenAmount.amount));
  const denominator: BigInt = BigInt.fromString(inTokenAmount.amount).mul(BigInt.fromString("1000")).add(amountInWithFee);
  return {
    token: outTokenAmount.token,
    amount: numerator.div(denominator).toString(),
  };
}

// Pricing function for exact output amounts. Returns minimum input amount, based on current reserves, if the trade were executed.
export function pairInputAmount(input: Input_pairInputAmount): TokenAmount {
  const pair: Pair = input.pair;
  const tradeTokenAmount: TokenAmount = input.outputAmount;
  const tradeAmount = BigInt.fromString(tradeTokenAmount.amount);
  if (tradeAmount.eq(BigInt.ZERO)) {
    throw new RangeError("Insufficient output amount: Output amount must be greater than zero");
  }
  if (BigInt.fromString(pair.tokenAmount0.amount) == BigInt.ZERO || BigInt.fromString(pair.tokenAmount1.amount) == BigInt.ZERO) {
    throw new RangeError("Insufficient liquidity: Pair reserves must be greater than zero")
  }
  let inTokenAmount: TokenAmount;
  let outTokenAmount: TokenAmount;
  if (tokenEquals({ token: pair.tokenAmount0.token, other: tradeTokenAmount.token })) {
    outTokenAmount = pair.tokenAmount0;
    inTokenAmount = pair.tokenAmount1;
  }  else {
    outTokenAmount = pair.tokenAmount1;
    inTokenAmount = pair.tokenAmount0;
  }
  const numerator: BigInt = BigInt.fromString(inTokenAmount.amount).mul(tradeAmount).mul(BigInt.fromString("1000"));
  const denominator: BigInt = BigInt.fromString(outTokenAmount.amount).sub(tradeAmount).mul(BigInt.fromString("997"));
  const resAmount: BigInt = numerator.div(denominator).add(BigInt.fromString("1"))
  return {
    token: inTokenAmount.token,
    amount: resAmount.toString(),
  };
}

/*
Calculates the exact amount of liquidity tokens minted from a given amount of token0 and token1.
  totalSupply is total supply of pair liquidity token.
  totalSupply must be looked up on-chain.
  The value returned from this function cannot be used as an input to getLiquidityValue.
*/
export function pairLiquidityMinted(input: Input_pairLiquidityMinted): TokenAmount {
  const pair: Pair = input.pair;
  const totalSupply: TokenAmount = input.totalSupply;
  const tokenAmount0: TokenAmount = input.tokenAmount0;
  const tokenAmount1: TokenAmount = input.tokenAmount1;
  // sort order
  const pairTokens = tokenSortsBefore({ token: pair.tokenAmount0.token, other: pair.tokenAmount1.token })
    ? [pair.tokenAmount0, pair.tokenAmount1]
    : [pair.tokenAmount1, pair.tokenAmount0];
  const tokenAmounts = tokenSortsBefore({ token: tokenAmount0.token, other: tokenAmount1.token })
    ? [tokenAmount0, tokenAmount1]
    : [tokenAmount1, tokenAmount0];
  // calculate liquidity to mint
  let liquidity: BigInt;
  let amount0 = BigInt.fromString(tokenAmounts[0].amount);
  let amount1 = BigInt.fromString(tokenAmounts[1].amount);
  const supply = BigInt.fromString(totalSupply.amount);
  if (supply.eq(BigInt.ZERO)) {
    const minLiq = BigInt.fromDigits([MINIMUM_LIQUIDITY]);
    liquidity = BigInt.sqrt(amount0.mul(amount1)).sub(minLiq);
  } else {
    const pairAmt0 = BigInt.fromString(pairTokens[0].amount);
    const pairAmt1 = BigInt.fromString(pairTokens[1].amount);
    amount0 = amount0.mul(supply).div(pairAmt0);
    amount1 = amount1.mul(supply).div(pairAmt1);
    liquidity = amount0.lt(amount1) ? amount0 : amount1;
  }
  if (liquidity.eq(BigInt.ZERO)) {
    throw new Error("Insufficient liquidity: liquidity minted must be greater than zero");
  }
  return {
    token: totalSupply.token,
    amount: liquidity.toString()
  }
}

/*
Calculates the exact amount of token0 or token1 that the given amount of liquidity tokens represent.
  totalSupply is total supply of pair liquidity token.
  totalSupply must be looked up on-chain.
  If the protocol charge is on, feeOn must be set to true, and kLast must be provided from an on-chain lookup.
  Values returned from this function cannot be used as inputs to getLiquidityMinted.
*/
export function pairLiquidityValue(input: Input_pairLiquidityValue): TokenAmount[] {
  const pair: Pair = input.pair;
  const totalSupply: TokenAmount = input.totalSupply;
  const liquidity: TokenAmount = input.liquidity;
  const feeOn: bool = (!input.feeOn.isNull && input.feeOn.value);
  const kLast: BigInt = BigInt.fromString(input.kLast != null ? input.kLast! : "0");

  const amount0 = BigInt.fromString(pair.tokenAmount0.amount);
  const amount1 = BigInt.fromString(pair.tokenAmount1.amount);
  const liqAmt = BigInt.fromString(liquidity.amount);
  let totalSupplyAmount = BigInt.fromString(totalSupply.amount);
  if (feeOn && kLast.gt(BigInt.ZERO)) {
    const rootK = BigInt.sqrt(amount0.mul(amount1));
    const rootKLast = BigInt.sqrt(kLast);
    if (rootK.gt(rootKLast)) {
      const numerator1 = totalSupplyAmount;
      const numerator2 = rootK.sub(rootKLast);
      const denominator = rootK.mul(BigInt.fromString("5")).add(rootKLast);
      const feeLiquidity = numerator1.mul(numerator2).div(denominator); // mulDiv
      totalSupplyAmount = totalSupplyAmount.add(feeLiquidity);
    }
  }
  const token0Value = amount0.mul(liqAmt).div(totalSupplyAmount);
  const token1Value = amount1.mul(liqAmt).div(totalSupplyAmount);

  return [
    {token: pair.tokenAmount0.token, amount: token0Value.toString()},
    {token: pair.tokenAmount1.token, amount: token1Value.toString()}
  ]
}