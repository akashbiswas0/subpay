import { useState } from "react";
import { directSendPAS, directSendToken } from "@/utils/contract";
import { TOKEN_TYPES } from "@/utils/constants";

type TxStatus = "idle" | "pending" | "success" | "error";

export function useDirectPay() {
  const [status, setStatus] = useState<TxStatus>("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setStatus("idle");
    setTxHash(null);
    setError(null);
  }

  async function pay(recipient: string, amount: bigint, tokenType: 0 | 1 | 2) {
    try {
      setStatus("pending");
      setError(null);

      let hash: string;
      if (tokenType === TOKEN_TYPES.PAS) {
        hash = await directSendPAS(recipient, amount);
      } else {
        hash = await directSendToken(recipient, amount, tokenType as 1 | 2);
      }

      setTxHash(hash);
      setStatus("success");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Transaction failed");
      setStatus("error");
    }
  }

  return { status, txHash, error, pay, reset };
}
