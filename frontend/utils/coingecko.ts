export interface DotPrices {
  usd: number;
  eur: number;
  inr: number;
  jpy: number;
  cny: number;
  vnd: number;
  krw: number;
  thb: number;
}

export async function getDotPrices(): Promise<DotPrices> {
  const response = await fetch(
    "https://api.coingecko.com/api/v3/simple/price?ids=polkadot&vs_currencies=usd,eur,inr,jpy,cny,vnd,krw,thb"
  );

  if (!response.ok) {
    throw new Error("Failed to fetch Polkadot prices");
  }

  const data = (await response.json()) as { polkadot: DotPrices };
  return data.polkadot;
}

export function fiatToPasPlanck(
  fiatAmount: number,
  currency: keyof DotPrices,
  prices: DotPrices
): bigint {
  if (!Number.isFinite(fiatAmount) || fiatAmount <= 0) return 0n;

  const priceInFiat = prices[currency];
  if (!priceInFiat) return 0n;

  const pasAmount = fiatAmount / priceInFiat;
  // PAS has 10 decimals, not 18
  return BigInt(Math.floor(pasAmount * 1e10));
}

export function planckToPas(planck: bigint): string {
  const pas = Number(planck) / 1e10; // 10 decimals
  return pas.toFixed(6);
}
