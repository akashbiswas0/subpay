import { encodeAddress } from "@polkadot/util-crypto";
import { hexToU8a } from "@polkadot/util";
import { BrowserProvider } from "ethers";
import type { Eip1193Provider } from "ethers";

export const RELAYER_EVM_ADDRESS =
  process.env.NEXT_PUBLIC_RELAYER_EVM_ADDRESS!;

export function evmToSS58(evmAddress: string): string {
  const hex = evmAddress.replace("0x", "").toLowerCase();
  if (hex.length !== 40) {
    throw new Error("Invalid EVM address — must be 20 bytes (40 hex chars)");
  }
  const padded = "0x" + hex + "eeeeeeeeeeeeeeeeeeeeeeee";
  return encodeAddress(hexToU8a(padded), 0);
}

export function fiatToPasPlanckXCM(
  fiatAmount: number,
  priceInFiat: number
): bigint {
  const pasAmount = fiatAmount / priceInFiat;
  return BigInt(Math.floor(pasAmount * 1e10));
}


export async function teleportPASFromEVM(
  senderEVM: string,
  recipientSS58: string,
  amountPlanck: bigint,
  destinationChain: string = "PeoplePaseo"
): Promise<{ txHash: string; relayerSS58: string }> {
  if (recipientSS58.startsWith("0x")) {
    throw new Error("Recipient must be SS58 — use evmToSS58() to convert first");
  }

  const provider = (window as Window & { ethereum?: Eip1193Provider }).ethereum;
  if (!provider) throw new Error("No wallet found");

  if (!RELAYER_EVM_ADDRESS) {
    throw new Error("NEXT_PUBLIC_RELAYER_EVM_ADDRESS is not configured");
  }

  const ethersProvider = new BrowserProvider(provider);
  const signer = await ethersProvider.getSigner();

  console.log("[XCM] Step 1: Sending PAS to relayer...");
  const tx = await signer.sendTransaction({
    to: RELAYER_EVM_ADDRESS,
    value: amountPlanck,
  });
  await tx.wait();
  console.log("[XCM] Step 1 done:", tx.hash);

  console.log(`[XCM] Step 2: Teleporting to ${destinationChain}...`);
  const res = await fetch("/api/xcm-teleport", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipientSS58,
      amountPlanck: amountPlanck.toString(),
      senderEVM,
      destinationChain,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error ?? "XCM teleport failed");
  }

  console.log("[XCM] Step 2 done:", data.txHash);
  return { txHash: data.txHash, relayerSS58: data.relayerSS58 ?? "" };
}