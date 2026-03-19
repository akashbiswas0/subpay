"use client";

import { useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { parseUnits } from "ethers";
import { useAccount } from "wagmi";
import TokenSelector from "@/components/TokenSelector";
import { usePaymentRouter } from "@/hooks/usePaymentRouter";
import { usePrices } from "@/hooks/usePrices";
import { fiatToPasPlanck } from "@/utils/coingecko";
import { TOKEN_TYPES } from "@/utils/constants";

type TokenChoice = "PAS" | "USDt" | "USDC";
type FiatCurrency = "usd" | "eur" | "inr";

interface RecipientRow {
  address: string;
  amount: string;
}

const explorerBase = "https://polkadot.testnet.routescan.io/tx";

export default function SplitBill() {
  const { isConnected } = useAccount();
  const { prices } = usePrices();
  const { status, txHash, error, split, reset } = usePaymentRouter();

  const [token, setToken] = useState<TokenChoice>("PAS");
  const [fiatCurrency, setFiatCurrency] = useState<FiatCurrency>("usd");
  const [recipients, setRecipients] = useState<RecipientRow[]>([
    { address: "", amount: "" },
    { address: "", amount: "" },
  ]);

  function updateRecipient(index: number, field: keyof RecipientRow, value: string) {
    setRecipients((current) =>
      current.map((recipient, currentIndex) =>
        currentIndex === index ? { ...recipient, [field]: value } : recipient
      )
    );
  }

  function addRecipient() {
    if (recipients.length >= 20) return;
    setRecipients((current) => [...current, { address: "", amount: "" }]);
  }

  function removeRecipient(index: number) {
    if (recipients.length <= 2) return;
    setRecipients((current) => current.filter((_, currentIndex) => currentIndex !== index));
  }

  const total = recipients.reduce(
    (sum, recipient) => sum + (Number(recipient.amount) || 0),
    0
  );

  async function handleSplit() {
    reset();

    const addresses = recipients.map((recipient) => recipient.address.trim());
    if (addresses.some((address) => !address)) return;

    if (token === "PAS") {
      if (!prices) return;
      const amounts = recipients.map((recipient) =>
        fiatToPasPlanck(Number(recipient.amount) || 0, fiatCurrency, prices)
      );
      await split(addresses, amounts, TOKEN_TYPES.PAS);
      return;
    }

    const amounts = recipients.map((recipient) => parseUnits(recipient.amount || "0", 6));
    await split(
      addresses,
      amounts,
      token === "USDt" ? TOKEN_TYPES.USDT : TOKEN_TYPES.USDC
    );
  }

  if (!isConnected) {
    return (
      <div className="panel flex flex-col items-center gap-4 rounded-[2rem] px-6 py-12 text-center shadow-glow">
        <p className="text-sm uppercase tracking-[0.24em] text-slate-500">
          Wallet Required
        </p>
        <h1 className="text-3xl font-semibold text-slate-950">
          Connect your wallet to split a bill.
        </h1>
        <p className="max-w-md text-sm leading-6 text-slate-600">
          This flow supports up to 20 recipients and automatically handles the
          token approval step for USDt and USDC.
        </p>
        <ConnectButton />
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <div className="panel rounded-[2rem] px-6 py-6 shadow-glow">
        <p className="text-xs uppercase tracking-[0.32em] text-slate-500">
          Group Payments
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">Split a bill</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Choose PAS, USDt, or USDC, enter each recipient, and send the whole split
          from a single wallet action flow.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
        <div className="panel space-y-6 rounded-[2rem] px-6 py-6 shadow-glow">
          <TokenSelector
            label="Pay With"
            options={["PAS", "USDt", "USDC"] as TokenChoice[]}
            value={token}
            onChange={setToken}
          />

          {token === "PAS" && (
            <div className="space-y-2">
              <label
                htmlFor="split-currency"
                className="text-sm uppercase tracking-[0.24em] text-slate-500"
              >
                Amounts Entered In
              </label>
              <select
                id="split-currency"
                value={fiatCurrency}
                onChange={(event) =>
                  setFiatCurrency(event.target.value as FiatCurrency)
                }
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-coral"
              >
                <option value="usd">USD</option>
                <option value="eur">EUR</option>
                <option value="inr">INR</option>
              </select>
            </div>
          )}

          <div className="space-y-3">
            {recipients.map((recipient, index) => (
              <div
                key={`${index}-${recipient.address}`}
                className="grid gap-2 rounded-[1.5rem] border border-slate-200 bg-white/85 p-3 md:grid-cols-[1fr,140px,48px]"
              >
                <input
                  value={recipient.address}
                  onChange={(event) =>
                    updateRecipient(index, "address", event.target.value)
                  }
                  placeholder="0x recipient address"
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-coral"
                />
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={recipient.amount}
                  onChange={(event) =>
                    updateRecipient(index, "amount", event.target.value)
                  }
                  placeholder={token === "PAS" ? fiatCurrency.toUpperCase() : token}
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-coral"
                />
                <button
                  type="button"
                  onClick={() => removeRecipient(index)}
                  disabled={recipients.length <= 2}
                  className="rounded-2xl border border-slate-200 text-sm text-slate-600 transition hover:border-red-200 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={addRecipient}
              disabled={recipients.length >= 20}
              className="text-sm font-medium text-coral transition hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Add recipient
            </button>
            <p className="text-sm text-slate-500">
              Total: {total.toFixed(2)} {token === "PAS" ? fiatCurrency.toUpperCase() : token}
            </p>
          </div>

          <button
            type="button"
            onClick={handleSplit}
            disabled={status === "approving" || status === "pending"}
            className="w-full rounded-2xl bg-slate-950 px-4 py-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {status === "approving"
              ? "Approving token..."
              : status === "pending"
                ? "Splitting..."
                : `Split with ${token}`}
          </button>
        </div>

        <aside className="space-y-4">
          <div className="panel rounded-[2rem] px-5 py-5 shadow-glow">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
              Status
            </p>
            <div className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
              {status === "idle" && (
                <p>Add recipients, choose the token, and submit the split when ready.</p>
              )}
              {status === "approving" && (
                <p className="text-amber-700">Approval in progress. Confirm it in your wallet.</p>
              )}
              {status === "pending" && (
                <p className="text-sky-700">Split transaction is waiting for confirmation.</p>
              )}
              {status === "success" && txHash && (
                <p className="text-emerald-700">
                  Split complete. View it on{" "}
                  <a
                    href={`${explorerBase}/${txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="underline"
                  >
                    Blockscout
                  </a>
                  .
                </p>
              )}
              {status === "error" && error && (
                <p className="text-red-600">{error}</p>
              )}
            </div>
          </div>

          <div className="panel rounded-[2rem] px-5 py-5 shadow-glow">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
              Limits
            </p>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
              <li>The contract caps splits at 20 recipients.</li>
              <li>USDt and USDC splits require an approval transaction first.</li>
              <li>PAS split totals must exactly match the native value sent.</li>
            </ul>
          </div>
        </aside>
      </div>
    </section>
  );
}
