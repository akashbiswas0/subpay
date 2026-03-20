const sdkCards = [
  {
    title: "Payment Links (Blinks)",
    code: `import { SubPay } from "@subpay/sdk";

const link = await SubPay.createPaymentLink({
  to: "0xA879...",
  amount: 10,
  token: "USDT",
  memo: "Coffee"
});
// returns: https://subpay.xyz/pay/abc123`,
  },
  {
    title: "Direct Payments",
    code: `await SubPay.send({
  to: "0xA879...",
  amount: 5,
  token: "PAS",
  currency: "usd"
});`,
  },
  {
    title: "Cross-Chain XCM",
    code: `await SubPay.sendCrossChain({
  to: "0xA879...",
  amount: 10,
  token: "PAS",
  destination: "PeoplePaseo"
});
// handles EVM -> SS58 conversion internally`,
  },
  {
    title: "React Hooks",
    code: `const { pay, status } = useSubPay();
const { createLink } = useSubPayLinks();
const { prices } = useSubPayPrices();`,
  },
  {
    title: "Verify Payment",
    code: `const verified = await SubPay.verifyPayment(txHash);
// returns { success, amount, token, from, to, timestamp }`,
  },
];

export default function SubpaySdkPage() {
  return (
    <section className="mx-auto mt-12 max-w-6xl space-y-6">
      <div className="rounded-[32px] border border-slate-200 bg-white px-8 py-10 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
        <div className="inline-flex items-center rounded-full bg-pink-50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-pink-600">
          Coming soon
        </div>
        <h1 className="mt-5 text-4xl font-semibold tracking-[-0.04em] text-slate-900">
          @subpay/sdk
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-500">
          It is the Stripe SDK of Polkadot payments: one import, any token, any chain within the Polkadot ecosystem, zero blockchain knowledge required.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sdkCards.map((card) => (
          <div
            key={card.title}
            className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)]"
          >
            <div className="mb-3 inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              SDK
            </div>
            <h2 className="text-lg font-semibold tracking-[-0.03em] text-slate-900">
              {card.title}
            </h2>
            <pre className="mt-4 overflow-x-auto rounded-2xl bg-slate-950 px-4 py-4 text-xs leading-6 text-slate-100">
              <code>{card.code}</code>
            </pre>
          </div>
        ))}
      </div>
    </section>
  );
}
