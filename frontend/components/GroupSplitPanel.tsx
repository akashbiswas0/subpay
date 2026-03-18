"use client";
import { useState } from "react";
import { useAccount } from "wagmi";
import { parseUnits } from "ethers";
import { useGroupSplit } from "@/hooks/useGroupSplit";

type TokenChoice = "PAS" | "USDt" | "USDC";
type SplitMode = "equal" | "custom";

const TOKEN_MAP: Record<TokenChoice, 0 | 1 | 2> = { PAS: 0, USDt: 1, USDC: 2 };
const TOKEN_DECIMALS: Record<TokenChoice, number> = { PAS: 10, USDt: 6, USDC: 6 };

interface GroupSplitPanelProps {
  groupId: bigint;
  members: string[];
  onSuccess?: () => void;
}

export default function GroupSplitPanel({
  groupId,
  members,
  onSuccess,
}: GroupSplitPanelProps) {
  const { address } = useAccount();
  const {
    status,
    txHash,
    error,
    handleAddExpenseEqual,
    handleAddExpenseCustom,
    reset,
  } = useGroupSplit();

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [token, setToken] = useState<TokenChoice>("PAS");
  const [splitMode, setSplitMode] = useState<SplitMode>("equal");
  const [customShares, setCustomShares] = useState<
    { address: string; amount: string }[]
  >(members.map((m) => ({ address: m, amount: "" })));

  function updateShare(i: number, value: string) {
    const updated = [...customShares];
    updated[i] = { ...updated[i], amount: value };
    setCustomShares(updated);
  }

  async function handleSubmit() {
    if (!description || !amount) return;
    reset();

    const decimals = TOKEN_DECIMALS[token];
    const tokenType = TOKEN_MAP[token];
    const totalAmount = parseUnits(amount, decimals);

    if (splitMode === "equal") {
      await handleAddExpenseEqual(groupId, totalAmount, tokenType, description);
    } else {
      const participants = customShares
        .filter((s) => s.amount && parseFloat(s.amount) > 0)
        .map((s) => s.address);
      const shares = customShares
        .filter((s) => s.amount && parseFloat(s.amount) > 0)
        .map((s) => parseUnits(s.amount, decimals));

      if (participants.length < 2) return;

      await handleAddExpenseCustom(
        groupId,
        totalAmount,
        tokenType,
        description,
        participants,
        shares
      );
    }

    if (status !== "error") {
      setDescription("");
      setAmount("");
      onSuccess?.();
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs text-slate-500 mb-1 block">
          What is this for?
        </label>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Dinner, Hotel, Taxi"
          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-pink-300"
        />
      </div>

      <div>
        <label className="text-xs text-slate-500 mb-1 block">Token</label>
        <div className="flex gap-2">
          {(["PAS", "USDt", "USDC"] as TokenChoice[]).map((t) => (
            <button
              key={t}
              onClick={() => setToken(t)}
              className={`flex-1 py-2 rounded-xl border text-xs font-medium transition ${
                token === t
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-700 border-slate-200"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs text-slate-500 mb-1 block">
          Total amount ({token})
        </label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-pink-300"
        />
      </div>

      <div>
        <label className="text-xs text-slate-500 mb-1 block">
          Split type
        </label>
        <div className="flex gap-2">
          {(["equal", "custom"] as SplitMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setSplitMode(m)}
              className={`flex-1 py-2 rounded-xl border text-xs font-medium capitalize transition ${
                splitMode === m
                  ? "bg-pink-600 text-white border-pink-600"
                  : "bg-white text-slate-700 border-slate-200"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {splitMode === "custom" && (
        <div className="space-y-2">
          <label className="text-xs text-slate-500 block">
            Amount per member ({token})
          </label>
          {customShares.map((s, i) => (
            <div key={s.address} className="flex gap-2 items-center">
              <span className="text-xs font-mono text-slate-500 flex-1 truncate">
                {s.address.slice(0, 8)}...{s.address.slice(-4)}
                {s.address.toLowerCase() === address?.toLowerCase() && (
                  <span className="ml-1 text-pink-500">(you)</span>
                )}
              </span>
              <input
                type="number"
                value={s.amount}
                onChange={(e) => updateShare(i, e.target.value)}
                placeholder="0.00"
                className="w-24 border border-slate-200 rounded-xl px-2 py-1.5 text-xs outline-none focus:border-pink-300"
              />
            </div>
          ))}
        </div>
      )}

      {status === "pending" && (
        <p className="text-xs text-blue-500">Recording expense on-chain...</p>
      )}
      {status === "success" && txHash && (
        <p className="text-xs text-green-600">
          ✓ Expense recorded.{" "}
          <a
            href={`https://polkadot.testnet.routescan.io/tx/${txHash}`}
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            View
          </a>
        </p>
      )}
      {status === "error" && error && (
        <p className="text-xs text-red-500">{error}</p>
      )}

      <button
        onClick={handleSubmit}
        disabled={!description || !amount || status === "pending"}
        className="w-full bg-pink-600 text-white rounded-xl py-2.5 text-sm font-medium disabled:opacity-50 hover:bg-pink-700 transition"
      >
        {status === "pending" ? "Recording..." : "Record Expense"}
      </button>
    </div>
  );
}
