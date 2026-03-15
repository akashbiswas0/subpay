import { useState } from "react";
import { useAccount } from "wagmi";
import {
  approveToken,
  sendPAS,
  sendToken,
  splitPAS,
  splitToken,
} from "@/utils/contract";
import { TOKEN_TYPES } from "@/utils/constants";

type TxStatus = "idle" | "approving" | "pending" | "success" | "error";

export function usePaymentRouter() {
  const { address } = useAccount();
  const [status, setStatus] = useState<TxStatus>("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [relayerSS58, setRelayerSS58] = useState<string | null>(null);

  function reset() {
    setStatus("idle");
    setTxHash(null);
    setError(null);
    setRelayerSS58(null);
  }

  async function pay(recipient: string, amount: bigint, tokenType: 0 | 1 | 2) {
    try {
      setStatus("pending");
      setError(null);

      let hash: string;
      if (tokenType === TOKEN_TYPES.PAS) {
        hash = await sendPAS(recipient, amount);
      } else {
        setStatus("approving");
        await approveToken(tokenType as 1 | 2, amount);
        setStatus("pending");
        hash = await sendToken(recipient, amount, tokenType as 1 | 2);
      }

      setTxHash(hash);
      setStatus("success");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Transaction failed");
      setStatus("error");
    }
  }

  async function split(
    recipients: string[],
    amounts: bigint[],
    tokenType: 0 | 1 | 2
  ) {
    try {
      setStatus("pending");
      setError(null);

      let hash: string;
      if (tokenType === TOKEN_TYPES.PAS) {
        hash = await splitPAS(recipients, amounts);
      } else {
        const total = amounts.reduce((sum, current) => sum + current, 0n);
        setStatus("approving");
        await approveToken(tokenType as 1 | 2, total);
        setStatus("pending");
        hash = await splitToken(recipients, amounts, tokenType as 1 | 2);
      }

      setTxHash(hash);
      setStatus("success");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Transaction failed");
      setStatus("error");
    }
  }

  async function crossChain(
    recipientSS58: string,
    amountPlanck: bigint,
    destinationChain: string = "PeoplePaseo"
  ) {
    try {
      setStatus("pending");
      setError(null);

      if (!address) throw new Error("Wallet not connected");

      const { teleportPASFromEVM } = await import("@/utils/xcmEncoder");

      const result = await teleportPASFromEVM(
        address,
        recipientSS58,
        amountPlanck,
        destinationChain
      );

      setTxHash(result.txHash);
      setRelayerSS58(result.relayerSS58);
      setStatus("success");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Cross-chain failed");
      setStatus("error");
    }
  }

  return {
    status,
    txHash,
    error,
    relayerSS58,
    pay,
    split,
    crossChain,
    reset,
  };
}
