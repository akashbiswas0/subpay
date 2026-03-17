"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Copy, CheckCheck, Link2 } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

type TokenType = "PAS" | "USDt" | "USDC";

export default function PolkaLinksPage() {
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [token, setToken] = useState<TokenType>("PAS");
  const [memo, setMemo] = useState("");
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const createLink = useMutation(api.paymentLinks.createLink);

  async function generateLink() {
    setValidationError(null);

    if (!to.trim()) {
      setValidationError("Recipient address is required.");
      return;
    }
    if (!to.startsWith("0x") || to.trim().length !== 42) {
      setValidationError("Please enter a valid EVM address (0x...).");
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      setValidationError("Enter a valid amount.");
      return;
    }

    setGenerating(true);
    try {
      const id = await createLink({
        to: to.trim(),
        amount: amount.trim(),
        token,
        memo: memo.trim(),
      });
      const link = `${window.location.origin}/pay/${id}`;
      setGeneratedLink(link);
      setCopied(false);
    } catch {
      setValidationError("Failed to generate link. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  async function copyLink() {
    if (!generatedLink) return;
    await navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <section className="mx-auto max-w-5xl space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1 mt-10">
          <Link2 size={20} className="text-pink-500" />
          <h1 className="text-2xl font-semibold text-slate-900">PolkaLinks</h1>
        </div>
        <p className="text-sm text-slate-500">
          Generate a short shareable payment link with an embedded QR code.
        </p>
      </div>

      <div
        className={`grid gap-6 ${
          generatedLink ? "xl:grid-cols-[minmax(0,1.1fr)_360px] xl:items-start" : ""
        }`}
      >
        <div
          className={`bg-white rounded-2xl border border-slate-200 p-6 space-y-5 ${
            generatedLink ? "" : "max-w-lg"
          }`}
        >
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1.5 block">
              Recipient Address
            </label>
            <input
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="0x..."
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-pink-400 transition"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                Amount
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-pink-400 transition"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                Token
              </label>
              <select
                value={token}
                onChange={(e) => setToken(e.target.value as TokenType)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-pink-400 transition"
              >
                <option value="PAS">PAS</option>
                <option value="USDt">USDt</option>
                <option value="USDC">USDC</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-1.5 block">
              Memo <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <input
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="e.g. Dinner bill, rent share..."
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-pink-400 transition"
            />
          </div>

          {validationError && (
            <p className="text-sm text-red-500">{validationError}</p>
          )}

          <button
            onClick={generateLink}
            disabled={generating}
            className="w-full bg-pink-600 text-white rounded-xl py-3 font-semibold text-sm hover:bg-pink-700 disabled:opacity-50 mt-12 transition"
          >
            {generating ? "Generating..." : "Generate PolkaLink"}
          </button>
        </div>

        {generatedLink && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5 xl:sticky xl:top-24">
            <div className="flex items-center gap-2">
              <Link2 size={16} className="text-pink-500" />
              <p className="text-sm font-semibold text-slate-800">Your PolkaLink</p>
            </div>

            <div className="flex justify-center">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <QRCodeSVG
                  value={generatedLink}
                  size={200}
                  level="M"
                  includeMargin={false}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-4 py-2.5 border border-slate-200">
              <p className="flex-1 text-xs text-slate-600 font-mono break-all">
                {generatedLink}
              </p>
              <button
                onClick={copyLink}
                className="flex-shrink-0 text-pink-500 hover:text-pink-700 transition"
                title="Copy link"
              >
                {copied ? <CheckCheck size={16} /> : <Copy size={16} />}
              </button>
            </div>

            {copied && (
              <p className="text-xs text-center text-emerald-600">Copied to clipboard!</p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
