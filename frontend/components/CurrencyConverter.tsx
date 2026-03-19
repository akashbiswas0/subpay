"use client";

import { useState } from "react";
import { usePrices } from "@/hooks/usePrices";
import { fiatToPasPlanck, planckToPas } from "@/utils/coingecko";

const CURRENCIES = ["usd", "eur", "inr", "jpy", "cny", "vnd", "krw", "thb"] as const;
type Currency = (typeof CURRENCIES)[number];

const CURRENCY_LABELS: Record<Currency, string> = {
  usd: "USD",
  eur: "EUR",
  inr: "INR",
  jpy: "YEN",
  cny: "YUAN",
  vnd: "VND",
  krw: "KRW",
  thb: "BAHT",
};

export default function CurrencyConverter() {
  const { prices, loading, error } = usePrices();
  const [currency, setCurrency] = useState<Currency>("usd");
  const [amount, setAmount] = useState("");

  const pasPlanck =
    prices && amount ? fiatToPasPlanck(Number(amount), currency, prices) : null;

  return (
    <section className="space-y-6">
      <div className="panel overflow-hidden rounded-[2rem] shadow-glow">
        <div className="border-b border-slate-200/70 px-6 py-5">
          <p className="text-xs uppercase tracking-[0.32em] text-slate-500">
            Live Converter
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">
            See the PAS you need before you pay.
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
            Fiat estimates come from CoinGecko and refresh every 60 seconds. Use
            this to price same-chain or cross-chain PAS transfers before you open
            the payment flows.
          </p>
        </div>

        <div className="grid gap-6 px-6 py-6 md:grid-cols-[140px,1fr]">
          <div className="space-y-2">
            <label
              className="text-sm uppercase tracking-[0.24em] text-slate-500"
              htmlFor="converter-currency"
            >
              Currency
            </label>
            <select
              id="converter-currency"
              value={currency}
              onChange={(event) => setCurrency(event.target.value as Currency)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-coral"
            >
              {CURRENCIES.map((item) => (
                <option key={item} value={item}>
                  {CURRENCY_LABELS[item]}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label
              className="text-sm uppercase tracking-[0.24em] text-slate-500"
              htmlFor="converter-amount"
            >
              Amount
            </label>
            <input
              id="converter-amount"
              type="number"
              min="0"
              step="any"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="Enter fiat amount"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 outline-none transition focus:border-coral"
            />
          </div>
        </div>

        <div className="grid gap-4 px-6 pb-6 md:grid-cols-4">
          {CURRENCIES.map((item) => (
            <div
              key={item}
              className={`rounded-[1.5rem] border px-4 py-4 ${
                currency === item
                  ? "border-coral bg-coral/10"
                  : "border-slate-200 bg-white/80"
              }`}
            >
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                {CURRENCY_LABELS[item]}
              </p>
              <p className="mt-2 text-xl font-semibold text-slate-900">
                {prices ? prices[item].toLocaleString() : "--"}
              </p>
              <p className="mt-1 text-sm text-slate-500">per PAS</p>
            </div>
          ))}
        </div>
      </div>

      <div className="panel rounded-[2rem] border px-6 py-5 shadow-glow">
        {loading && <p className="text-sm text-slate-500">Fetching prices...</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {!loading && !error && !pasPlanck && (
          <p className="text-sm text-slate-500">
            Enter a fiat amount to estimate the PAS needed.
          </p>
        )}
        {pasPlanck !== null && prices && amount && (
          <>
            <p className="text-sm uppercase tracking-[0.24em] text-slate-500">
              Estimate
            </p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">
              {planckToPas(pasPlanck)} PAS
            </p>
            <p className="mt-2 text-sm text-slate-600">
              {amount} {CURRENCY_LABELS[currency]} at {prices[currency].toLocaleString()}{" "}
              {CURRENCY_LABELS[currency]} per PAS.
            </p>
          </>
        )}
      </div>
    </section>
  );
}
