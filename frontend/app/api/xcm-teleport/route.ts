import { NextRequest, NextResponse } from "next/server";
import { Builder, type TDestination } from "@paraspell/sdk";
import {
  entropyToMiniSecret,
  mnemonicToEntropy,
  ss58Address,
} from "@polkadot-labs/hdkd-helpers";
import { getPolkadotSigner } from "polkadot-api/signer";
import { sr25519CreateDerive } from "@polkadot-labs/hdkd";

const VALID_DESTINATIONS = [
  "PeoplePaseo",
  "AssetHubPaseo",
  "BridgeHubPaseo",
  "CoretimePaseo",
  "NeuroWebPaseo",
];

function getSigner() {
  const seedPhrase = process.env.SUBSTRATE_SEED_PHRASE;
  if (!seedPhrase) throw new Error("SUBSTRATE_SEED_PHRASE not set");
  const entropy = mnemonicToEntropy(seedPhrase);
  const miniSecret = entropyToMiniSecret(entropy);
  const derive = sr25519CreateDerive(miniSecret);
  const keyPair = derive("");
  return getPolkadotSigner(keyPair.publicKey, "Sr25519", keyPair.sign);
}

export async function POST(req: NextRequest) {
  try {
    const { recipientSS58, amountPlanck, senderEVM, destinationChain } = await req.json();

    if (!recipientSS58 || !amountPlanck || !senderEVM) {
      return NextResponse.json(
        { error: "Missing recipientSS58, amountPlanck, or senderEVM" },
        { status: 400 }
      );
    }

    if (recipientSS58.startsWith("0x")) {
      return NextResponse.json(
        { error: "Recipient must be an SS58 address — use evmToSS58() to convert first" },
        { status: 400 }
      );
    }

    const destination = destinationChain ?? "PeoplePaseo";

    if (!VALID_DESTINATIONS.includes(destination)) {
      return NextResponse.json(
        { error: `Unsupported destination: ${destination}` },
        { status: 400 }
      );
    }

    const signer = getSigner();
    const relayerSS58 = ss58Address(signer.publicKey);

    console.log("[XCM API] Relayer:", relayerSS58);
    console.log("[XCM API] Sender EVM:", senderEVM);
    console.log("[XCM API] Recipient SS58:", recipientSS58);
    console.log("[XCM API] Amount planck:", amountPlanck);
    console.log("[XCM API] Destination:", destination);

    const tx = await Builder()
      .from("AssetHubPaseo")
      .to(destination as TDestination)
      .currency({
        symbol: "PAS",
        amount: BigInt(amountPlanck),
      })
      .address(recipientSS58)
      .senderAddress(relayerSS58)
      .build();

    const result = await tx.signAndSubmit(signer);

    console.log("[XCM API] Success:", result.txHash);

    return NextResponse.json({
      success: true,
      txHash: result.txHash,
      block: result.block,
      relayerSS58,
    });
  } catch (e: unknown) {
    console.error("[XCM API] Error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "XCM transfer failed" },
      { status: 500 }
    );
  }
}


