"use client";

import { useParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { parseUnits } from "ethers";
import { useDirectPay } from "@/hooks/useDirectPay";
import { TOKEN_TYPES } from "@/utils/constants";

const explorerBase =
  "https://polkadot.testnet.routescan.io/tx/";

function tokenTypeFromString(token: string): 0 | 1 | 2 {
  if (token === "PAS") return TOKEN_TYPES.PAS as 0;
  if (token === "USDt" || token === "USDT") return TOKEN_TYPES.USDT as 1;
  return TOKEN_TYPES.USDC as 2;
}

function amountToBigInt(amount: string, token: string): bigint {
  const decimals = token === "PAS" ? 18 : 6;
  return parseUnits(amount, decimals);
}

export default function PayPage() {
  const { slug } = useParams<{ slug: string }>();
  const { isConnected } = useAccount();
  const { status, txHash, error, pay, reset } = useDirectPay();

  const payload = useQuery(api.paymentLinks.getLink, { id: slug ?? "" });

  if (payload === undefined) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <Loader2 size={32} className="text-pink-400 animate-spin mb-4" />
        <p className="text-sm text-slate-500">Loading payment details...</p>
      </div>
    );
  }

  if (!payload) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <AlertTriangle size={40} className="text-red-400 mb-4" />
        <h1 className="text-xl font-semibold text-slate-800 mb-2">Invalid PolkaLink</h1>
        <p className="text-sm text-slate-500">
          This payment link has expired or does not exist.
        </p>
      </div>
    );
  }

  const isPending = false;

  async function handlePay() {
    if (isPending) return;
    reset();
    const tokenType = tokenTypeFromString(payload!.token);
    const amountBig = amountToBigInt(payload!.amount, payload!.token);
    await pay(payload!.to, amountBig, tokenType);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b w-full from-pink-50 to-slate-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <p className="text-xs uppercase tracking-widest text-pink-500 font-semibold mb-1">
            subpay · Payment Request
          </p>
          <h1 className="text-2xl font-bold text-slate-900">
            {payload.amount} {payload.token}
          </h1>
          {payload.memo && (
            <p className="text-sm text-slate-500 mt-1">{payload.memo}</p>
          )}
        </div>

        <div className="flex justify-center">
          <div className="p-5 bg-white rounded-3xl shadow-md border border-slate-200">
            <QRCodeSVG
              value={payload.to}
              size={220}
              level="M"
              includeMargin={false}
            />
          </div>
          
        </div>
        <p className="text-xs text-center text-slate-400 -mt-4">
          Scan to get the recipient address
        </p>

        <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
          <div className="px-5 py-3 flex items-center justify-between gap-4">
            <p className="text-xs uppercase tracking-wide text-slate-400 shrink-0">To</p>
            <p className="text-sm font-mono text-slate-700 truncate">
              {payload.to}
            </p>
          </div>
          <div className="px-5 py-3 flex items-center justify-between">
            <p className="text-xs uppercase tracking-wide text-slate-400">Amount</p>
            <p className="text-sm font-semibold text-slate-900">
              {payload.amount} {payload.token}
            </p>
          </div>
          {payload.memo && (
            <div className="px-5 py-3 flex items-center justify-between">
              <p className="text-xs uppercase tracking-wide text-slate-400">Memo</p>
              <p className="text-sm text-slate-700">{payload.memo}</p>
            </div>
          )}
        </div>

        {status === "success" && txHash && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-4 text-center space-y-2">
            <CheckCircle2 size={28} className="text-emerald-500 mx-auto" />
            <p className="text-sm font-semibold text-emerald-800">Payment sent!</p>
            <a
              href={`${explorerBase}${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-emerald-600 underline break-all"
            >
              View on explorer
            </a>
          </div>
        )}

        {status === "error" && error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-3 text-center">
            <p className="text-sm text-red-700">{error}</p>
            <button onClick={reset} className="text-xs text-red-500 underline mt-1">
              Try again
            </button>
          </div>
        )}

        {!isConnected ? (
          <div className="flex flex-col items-center gap-2">
            <p className="text-xs text-slate-500">Connect your wallet to pay</p>
            <div className="[&_button]:w-full w-full">
              <ConnectButton />
            </div>
          </div>
        ) : status !== "success" ? (
          <button
            onClick={handlePay}
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 bg-pink-600 text-white rounded-2xl py-3.5 font-semibold text-sm hover:bg-pink-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isPending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Sending…
              </>
            ) : (
              "Pay with subpay"
            )}
          </button>
        ) : null}
      </div>
    </div>
  );
}

