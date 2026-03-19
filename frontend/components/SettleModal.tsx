"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAccount } from "wagmi";
import { useGroupSplit } from "@/hooks/useGroupSplit";
import { getAddress } from "ethers";
import { formatUnits } from "ethers";

type TokenChoice = "PAS" | "USDt" | "USDC";

const TOKEN_MAP: Record<TokenChoice, 0 | 1 | 2> = { PAS: 0, USDt: 1, USDC: 2 };
const TOKEN_DECIMALS: Record<TokenChoice, number> = { PAS: 18, USDt: 6, USDC: 6 };

interface SettleModalProps {
  groupId: string;
  onClose: () => void;
}

export default function SettleModal({ groupId, onClose }: SettleModalProps) {
  const { address } = useAccount();
  const { status, error, handleSettleDebt, fetchDebt, reset } = useGroupSplit();

  const [creditor, setCreditor] = useState("");
  const [token, setToken] = useState<TokenChoice>("PAS");
  const [amount, setAmount] = useState("");
  const [currentDebt, setCurrentDebt] = useState<bigint | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (!creditor || !address || !groupId) return;
    if (!creditor.startsWith("0x") || creditor.length !== 42) return;

    let checksummedCreditor: string;
    let checksummedDebtor: string;

    try {
      checksummedCreditor = getAddress(creditor);
      checksummedDebtor = getAddress(address);
    } catch {
      return;
    }

    fetchDebt(
      BigInt(groupId),
      checksummedDebtor,
      checksummedCreditor,
      TOKEN_MAP[token]
    ).then(setCurrentDebt);
  }, [creditor, token, address, groupId]);

  const debtFormatted =
    currentDebt !== null
      ? token === "PAS"
        ? `${formatUnits(currentDebt, 18)} PAS`
        : `${(Number(currentDebt) / Math.pow(10, TOKEN_DECIMALS[token])).toFixed(4)} ${token}`
      : null;

  function amountToPlanck(value: string): bigint {
    if (!value || parseFloat(value) <= 0) return 0n;
    const decimals = TOKEN_DECIMALS[token];
    const [intPart, decPart = ""] = value.split(".");
    const decPadded = decPart.padEnd(decimals, "0").slice(0, decimals);
    return BigInt(intPart) * BigInt(10 ** decimals) + BigInt(decPadded);
  }

  const amountPlanck = amountToPlanck(amount);

  async function handleSubmit() {
    if (!creditor || !amount || !groupId || !address) return;
    reset();
    setValidationError(null);

    let checksummedCreditor: string;
    try {
      checksummedCreditor = getAddress(creditor);
    } catch {
      setValidationError("Invalid address format");
      return;
    }

    if (amountPlanck <= 0n) {
      setValidationError("Enter a valid amount");
      return;
    }

    if (currentDebt !== null && amountPlanck > currentDebt) {
      setValidationError(`Amount exceeds debt. Max: ${debtFormatted}`);
      return;
    }

    await handleSettleDebt(
      BigInt(groupId),
      checksummedCreditor,
      amountPlanck,
      TOKEN_MAP[token]
    );

    if (status !== "error") {
      onClose();
    }
  }

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-md supports-[backdrop-filter]:bg-slate-950/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl mx-4 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">⚖ Settle Debt</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-xl leading-none"
          >
            ×
          </button>
        </div>

        
        <div>
          <label className="text-sm text-gray-500 mb-1 block">
            Pay to (creditor address)
          </label>
          <input
            value={creditor}
            onChange={(e) => {
              setCreditor(e.target.value);
              setCurrentDebt(null);
            }}
            placeholder="0x..."
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
        </div>

        
        <div>
          <label className="text-sm text-gray-500 mb-1 block">Token</label>
          <div className="flex gap-2">
            {(["PAS", "USDt", "USDC"] as TokenChoice[]).map((t) => (
              <button
                key={t}
                onClick={() => {
                  setToken(t);
                  setAmount("");
                  setCurrentDebt(null);
                }}
                className={`flex-1 py-2 rounded-lg border text-sm font-medium transition ${
                  token === t
                    ? "bg-gray-900 text-white border-gray-900"
                    : "bg-white text-gray-700"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Select the same token used when the expense was recorded
          </p>
        </div>

        
        {currentDebt !== null && (
          <div className="bg-gray-50 rounded-xl p-3">
            {currentDebt > 0n ? (
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">You owe</p>
                <p className="text-sm font-medium text-red-500">{debtFormatted}</p>
              </div>
            ) : (
              <p className="text-sm text-green-600">
                No debt found for {token} — try a different token
              </p>
            )}
          </div>
        )}

        
        <div>
          <label className="text-sm text-gray-500 mb-1 block">
            Amount to settle ({token})
          </label>
          <div className="flex gap-2 items-center">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={`e.g. ${debtFormatted ?? "0.00"}`}
              step="any"
              min="0"
              className="flex-1 border rounded-lg px-3 py-2 text-sm"
            />
            {currentDebt !== null && currentDebt > 0n && (
              <button
                onClick={() =>
                  setAmount(
                    token === "PAS"
                      ? formatUnits(currentDebt, 18)
                      : (
                          Number(currentDebt) /
                          Math.pow(10, TOKEN_DECIMALS[token])
                        ).toFixed(6)
                  )
                }
                className="text-xs text-pink-600 border border-pink-200 rounded-lg px-3 py-2 whitespace-nowrap hover:bg-pink-50 transition"
              >
                Pay full
              </button>
            )}
          </div>

          {token === "PAS" && amount && amountPlanck > 0n && (
            <p className="text-xs text-slate-400 mt-1">
              Sending {formatUnits(amountPlanck, 18)} PAS on-chain
            </p>
          )}
        </div>

        {status === "approving" && (
          <p className="text-sm text-yellow-600">Step 1/2: Approving token...</p>
        )}
        {status === "pending" && (
          <p className="text-sm text-blue-500">Settling debt...</p>
        )}
        {(error || validationError) && (
          <p className="text-sm text-red-500">{validationError ?? error}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={
            !creditor ||
            !amount ||
            amountPlanck <= 0n ||
            status === "pending" ||
            status === "approving"
          }
          className="w-full bg-pink-600 text-white rounded-xl py-3 font-medium disabled:opacity-50"
        >
          {status === "approving"
            ? "Approving..."
            : status === "pending"
            ? "Settling..."
            : `Settle with ${token}`}
        </button>
      </div>
    </div>,
    document.body
  );
}
