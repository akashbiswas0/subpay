"use client";

import { useState, useEffect, useRef } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { parseUnits } from "ethers";
import { useAccount } from "wagmi";
import { usePaymentRouter } from "@/hooks/usePaymentRouter";
import { usePrices } from "@/hooks/usePrices";
import { fiatToPasPlanck, planckToPas } from "@/utils/coingecko";
import { TOKEN_TYPES } from "@/utils/constants";
import { evmToSS58 } from "@/utils/xcmEncoder";
import TokenSelector from "@/components/TokenSelector";

type ChainMode = "same" | "cross";
type TokenChoice = "PAS" | "USDt" | "USDC";
type FiatCurrency = "usd" | "eur" | "inr" | "jpy" | "cny" | "vnd" | "krw" | "thb";

const FIAT_OPTIONS: { value: FiatCurrency; label: string; flag: string }[] = [
  { value: "usd", label: "USD", flag: "🇺🇸" },
  { value: "eur", label: "EUR", flag: "🇪🇺" },
  { value: "inr", label: "INR", flag: "🇮🇳" },
  { value: "jpy", label: "YEN", flag: "🇯🇵" },
  { value: "cny", label: "YUAN", flag: "🇨🇳" },
  { value: "vnd", label: "VND", flag: "🇻🇳" },
  { value: "krw", label: "KRW", flag: "🇰🇷" },
  { value: "thb", label: "BAHT", flag: "🇹🇭" },
];

const PARACHAINS = [
  { label: "People Chain", value: "PeoplePaseo" },
  { label: "Asset Hub", value: "AssetHubPaseo" },
  { label: "Bridge Hub", value: "BridgeHubPaseo" },
  { label: "Coretime", value: "CoretimePaseo" },
  { label: "NeuroWeb", value: "NeuroWebPaseo" },
];

const SAME_CHAIN_EXPLORER = "https://polkadot.testnet.routescan.io/tx/";
const XCM_EXPLORER = "https://assethub-paseo.subscan.io/extrinsic/";

type AnimMilestone = { label: string; completed: boolean; active: boolean };

function isValidSS58(address: string): boolean {
  
  return (
    !address.startsWith("0x") &&
    address.length >= 46 &&
    address.length <= 50
  );
}

function isValidEVM(address: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(address);
}

export default function SendPayment() {
  const { isConnected, address } = useAccount();
  const { prices } = usePrices();
  const { status, txHash, error, relayerSS58, pay, crossChain, reset } = usePaymentRouter();

  const [mounted, setMounted] = useState(false);
  const [animMilestones, setAnimMilestones] = useState<AnimMilestone[]>([]);
  const [ss58Loading, setSS58Loading] = useState(false);
  const timerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);
  const ss58TimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [chainMode, setChainMode] = useState<ChainMode>("same");
  const [token, setToken] = useState<TokenChoice>("PAS");
  const [destinationChain, setDestinationChain] = useState("PeoplePaseo");
  const [recipient, setRecipient] = useState("");
  const [convertedSS58, setConvertedSS58] = useState<string | null>(null);
  const [fiatCurrency, setFiatCurrency] = useState<FiatCurrency>("usd");
  const [amount, setAmount] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (chainMode === "cross") {
      setRecipient("");
      setConvertedSS58(null);
      setSS58Loading(false);
      if (ss58TimerRef.current) clearTimeout(ss58TimerRef.current);
    }
  }, [chainMode]);

  function handleRecipientChange(value: string) {
    setRecipient(value);
    setValidationError(null);
    setConvertedSS58(null);
    setSS58Loading(false);
    if (ss58TimerRef.current) clearTimeout(ss58TimerRef.current);

    if (chainMode === "cross") {
      if (value.startsWith("0x") && value.length === 42) {
        setSS58Loading(true);
        ss58TimerRef.current = setTimeout(() => {
          try {
            setConvertedSS58(evmToSS58(value));
          } catch {
            setConvertedSS58(null);
          }
          setSS58Loading(false);
        }, 700);
      } else if (!value.startsWith("0x") && value.length > 40) {
        setConvertedSS58(value);
      }
    }
  }

  const pasPlanck =
    prices && amount
      ? fiatToPasPlanck(Number(amount), fiatCurrency, prices)
      : null;

  function startMilestoneAnimation(mode: ChainMode) {
    timerRefs.current.forEach(clearTimeout);
    timerRefs.current = [];

    const chainLabel =
      PARACHAINS.find((p) => p.value === destinationChain)?.label ??
      destinationChain;

    const steps: string[] =
      mode === "cross"
        ? [
            "Transaction initiated",
            "Sending PAS to relayer",
            "Teleporting via XCM",
            `Reaching ${chainLabel}`,
          ]
        : [
            "Transaction submitted",
            "Awaiting on-chain confirmation",
            "Finalizing transaction",
          ];

    setAnimMilestones(
      steps.map((label, i) => ({ label, completed: false, active: i === 0 }))
    );

    steps.slice(1).forEach((_, i) => {
      const stepIdx = i + 1;
      const t = setTimeout(() => {
        setAnimMilestones((prev) =>
          prev.map((m, idx) => ({
            ...m,
            completed: idx < stepIdx,
            active: idx === stepIdx,
          }))
        );
      }, stepIdx * 10_000);
      timerRefs.current.push(t);
    });
  }

  useEffect(() => {
    if (status === "success") {
      timerRefs.current.forEach(clearTimeout);
      timerRefs.current = [];
      setAnimMilestones((prev) =>
        prev.map((m) => ({ ...m, completed: true, active: false }))
      );
    }
  }, [status]);

  useEffect(() => {
    return () => {
      timerRefs.current.forEach(clearTimeout);
    };
  }, []);

  function validateInputs(): string | null {
    if (!recipient.trim()) return "Recipient address is required";
    if (!amount.trim() || Number(amount) <= 0) return "Enter a valid amount";

    if (chainMode === "cross") {
      const target = convertedSS58 ?? recipient;
      if (!target || target.startsWith("0x")) {
        return "Enter a valid EVM (0x) or SS58 address";
      }
      if (!pasPlanck || pasPlanck <= 0n) {
        return "Could not calculate PAS amount — check price feed";
      }
    } else {
      if (!isValidEVM(recipient)) {
        return "Invalid EVM address — must be 0x followed by 40 hex characters";
      }
    }

    return null;
  }

  const canSubmit =
    Boolean(recipient.trim()) &&
    Boolean(amount.trim()) &&
    status !== "approving" &&
    status !== "pending";

  async function handleSubmit() {
    reset();
    setValidationError(null);
    setAnimMilestones([]);
    timerRefs.current.forEach(clearTimeout);
    timerRefs.current = [];

    const err = validateInputs();
    if (err) {
      setValidationError(err);
      return;
    }

    if (chainMode === "cross") {
      if (!pasPlanck) return;
      const target = convertedSS58 ?? recipient;
      if (!target || target.startsWith("0x")) {
        setValidationError("Enter a valid EVM (0x) or SS58 address");
        return;
      }
      startMilestoneAnimation("cross");
      await crossChain(target, pasPlanck, destinationChain);
      return;
    }

    startMilestoneAnimation("same");

    if (token === "PAS") {
      if (!pasPlanck) return;
      const pasPlanckEVM = pasPlanck * 10n ** 8n;
      await pay(recipient.trim(), pasPlanckEVM, TOKEN_TYPES.PAS);
      return;
    }

    const tokenAmount = parseUnits(amount, 6);
    await pay(
      recipient.trim(),
      tokenAmount,
      token === "USDt" ? TOKEN_TYPES.USDT : TOKEN_TYPES.USDC
    );
  }

  if (!mounted) return null;

  if (!isConnected) {
    return (
      <div className="panel flex flex-col items-center gap-4 rounded-[2rem] px-6 py-12 text-center shadow-glow">
        <p className="text-sm uppercase tracking-[0.24em] text-slate-500">
          Wallet Required
        </p>
        <h1 className="text-3xl font-semibold text-slate-950">
          Connect your wallet to start sending.
        </h1>
        <p className="max-w-md text-sm leading-6 text-slate-600">
          Same-chain flows use EVM addresses on Passet Hub. Cross-chain PAS
          sends use a People Chain SS58 destination.
        </p>
        <ConnectButton />
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <div className="">
       
        
       
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
        <div className="panel space-y-6 rounded-[2rem] px-4 py-6 shadow-glow">
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.24em] text-slate-500">
              Route
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setChainMode("same");
                  setRecipient("");
                  setConvertedSS58(null);
                  setValidationError(null);
                  setAnimMilestones([]);
                  timerRefs.current.forEach(clearTimeout);
                  timerRefs.current = [];
                  reset();
                }}
                className={`rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                  chainMode === "same"
                    ? "border-pink-600 bg-pink-600 text-white"
                    : "border-slate-200 bg-white text-slate-700"
                }`}
              >
                Same Chain
              </button>
              <button
                type="button"
                onClick={() => {
                  setChainMode("cross");
                  setToken("PAS");
                  setRecipient("");
                  setConvertedSS58(null);
                  setSS58Loading(false);
                  if (ss58TimerRef.current) clearTimeout(ss58TimerRef.current);
                  setValidationError(null);
                  setAnimMilestones([]);
                  timerRefs.current.forEach(clearTimeout);
                  timerRefs.current = [];
                  reset();
                }}
                className={`rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                  chainMode === "cross"
                    ? "border-pink-600 bg-pink-600 text-white"
                    : "border-slate-200 bg-white text-slate-700"
                }`}
              >
                Para Chain
              </button>
            </div>
          </div>

          {chainMode === "cross" && (
            <div className="space-y-2">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">
                Destination Parachain
              </p>
              <select
                value={destinationChain}
                onChange={(e) => setDestinationChain(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-pink-600"
              >
                {PARACHAINS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {chainMode === "same" && (
            <TokenSelector
              label="Token"
              options={["PAS", "USDt", "USDC"] as TokenChoice[]}
              value={token}
              onChange={setToken}
            />
          )}

          <div className="space-y-2">
            <label
              htmlFor="recipient"
              className="text-sm uppercase tracking-[0.24em] text-slate-500"
            >
              {chainMode === "cross"
                ? "Recipient Address (EVM or SS58)"
                : "Recipient EVM Address"}
            </label>
            <input
              id="recipient"
              value={recipient}
              onChange={(e) => handleRecipientChange(e.target.value)}
              placeholder={
                chainMode === "cross"
                  ? "0x... or 5Grw..."
                  : "0x..."
              }
              className={`w-full rounded-2xl border px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-pink-600 ${
                validationError && validationError.includes("address")
                  ? "border-red-400 bg-red-50"
                  : "border-slate-200 bg-white"
              }`}
            />
            {chainMode === "cross" && ss58Loading && (
              <div className="rounded-xl bg-gray-50 px-3 py-2 space-y-1.5">
                <div className="h-2.5 w-36 rounded bg-gray-200 animate-pulse" />
                <div className="h-2.5 w-full rounded bg-gray-200 animate-pulse" />
                <div className="h-2.5 w-3/4 rounded bg-gray-200 animate-pulse" />
              </div>
            )}
            {chainMode === "cross" && !ss58Loading && convertedSS58 && recipient.startsWith("0x") && (
              <div className="rounded-xl bg-gray-50 px-3 py-2">
                <p className="text-xs text-gray-400">People Chain SS58 address</p>
                <p className="text-xs font-mono text-gray-600 break-all mt-0.5">
                  {convertedSS58}
                </p>
              </div>
            )}
            {chainMode === "cross" && (
              <p className="text-xs text-slate-400">
                Enter an EVM address, it will be auto-converted to SS58 address
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="amount"
              className="text-sm uppercase tracking-[0.24em] text-slate-500"
            >
              Amount
            </label>
            <div className="grid gap-2 sm:grid-cols-[140px,1fr]">
              {(chainMode === "cross" || token === "PAS") && (
                <select
                  value={fiatCurrency}
                  onChange={(e) =>
                    setFiatCurrency(e.target.value as FiatCurrency)
                  }
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-pink-600"
                >
                  {FIAT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.flag} {opt.label}
                    </option>
                  ))}
                </select>
              )}
              <input
                id="amount"
                type="number"
                min="0"
                step="any"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setValidationError(null);
                }}
                placeholder={
                  chainMode === "cross" || token === "PAS"
                    ? "Fiat amount"
                    : "Token amount"
                }
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-pink-600"
              />
            </div>
            {pasPlanck && (chainMode === "cross" || token === "PAS") && (
              <p className="text-sm text-slate-500">
                Approximate value: {planckToPas(pasPlanck)} PAS
              </p>
            )}
          </div>

          {validationError && (
            <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {validationError}
            </p>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full rounded-2xl bg-slate-950 px-4 py-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {status === "approving"
              ? "Approving token..."
              : status === "pending"
                ? "Sending..."
                : chainMode === "cross"
                  ? "Send to Parachain"
                  : `Send ${token}`}
          </button>
        </div>

        <aside className="space-y-4">
          <div className="panel rounded-[2rem] px-5 py-5 shadow-glow">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
              Transaction Status
            </p>
            <div className="mt-3 text-sm leading-6 text-slate-600">
              {animMilestones.length === 0 && status === "idle" && (
                <p className="text-slate-400">
                  Ready when you are. Token payments will automatically trigger
                  approval first.
                </p>
              )}
              {status === "approving" && (
                <p className="text-amber-700 text-xs">
                  Approval in progress — confirm in your wallet.
                </p>
              )}

              {animMilestones.length > 0 && (
                <div className="mt-2 space-y-0">
                  {animMilestones.map((m, i) => (
                    <div key={m.label} className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        {m.completed ? (
                          <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                            <svg
                              className="w-3 h-3 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={3}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </div>
                        ) : m.active ? (
                          <div className="w-6 h-6 rounded-full border-2 border-pink-600 bg-pink-600/10 flex items-center justify-center flex-shrink-0 animate-pulse">
                            <div className="w-2 h-2 rounded-full bg-pink-600" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full border-2 border-slate-200 flex-shrink-0" />
                        )}
                        {i < animMilestones.length - 1 && (
                          <div
                            className={`w-0.5 h-7 mt-1 ${
                              m.completed ? "bg-emerald-300" : "bg-slate-200"
                            }`}
                          />
                        )}
                      </div>

                      <p
                        className={`pt-0.5 text-sm ${
                          m.completed
                            ? "text-emerald-700"
                            : m.active
                              ? "font-semibold text-slate-900"
                              : "text-slate-400"
                        }`}
                      >
                        {m.label}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {status === "success" && txHash && (
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <p className="text-emerald-700 font-medium text-sm">
                    success!{" "}
                    <a
                      href={`${chainMode === "same" ? SAME_CHAIN_EXPLORER : XCM_EXPLORER}${txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="underline decoration-emerald-400"
                    >
                      View on Explorer
                    </a>
                  </p>
                </div>
              )}
              {status === "error" && error && (
                <p className="mt-3 text-red-600 text-xs">{error}</p>
              )}
            </div>
          </div>

          
        </aside>
      </div>
    </section>
  );
}