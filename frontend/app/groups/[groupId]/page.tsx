"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAccount } from "wagmi";
import Link from "next/link";
import { createPortal } from "react-dom";
import { useGroupSplit } from "@/hooks/useGroupSplit";
import { GroupInfo, ExpenseInfo, getBalance } from "@/utils/groupContract";
import GroupChat from "@/components/GroupChat";
import GroupSplitPanel from "@/components/GroupSplitPanel";
import SettleModal from "@/components/SettleModal";
import { formatUnits } from "ethers";
import type { ExpenseFeedItem } from "@/components/GroupChat";

const TOKEN_LABELS = ["PAS", "USDt", "USDC"];
const TOKEN_DECIMALS = [18, 6, 6];

function formatAmount(amount: bigint, tokenType: number): string {
  const decimals = TOKEN_DECIMALS[tokenType] ?? 18;
  return `${formatUnits(amount, decimals)} ${TOKEN_LABELS[tokenType]}`;
}

export default function GroupDetailPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const { address } = useAccount();
  const { fetchExpenses } = useGroupSplit();

  const [group, setGroup] = useState<GroupInfo | null>(null);
  const [expenses, setExpenses] = useState<ExpenseInfo[]>([]);
  const [myBalances, setMyBalances] = useState<{ [token: number]: bigint }>({});
  const [loading, setLoading] = useState(true);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [settleModalOpen, setSettleModalOpen] = useState(false);

  useEffect(() => {
    if (!groupId || !address) return;
    async function load() {
      try {
        const { getGroup } = await import("@/utils/groupContract");
        const g = await getGroup(BigInt(groupId));
        setGroup(g);

        if (g.expenseIds.length > 0) {
          const exp = await fetchExpenses(g.expenseIds);
          setExpenses(exp);
        }

        const bals: { [token: number]: bigint } = {};
        for (let t = 0; t <= 2; t++) {
          bals[t] = await getBalance(
            BigInt(groupId),
            address!,
            t as 0 | 1 | 2
          );
        }
        setMyBalances(bals);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [groupId, address]);

  if (loading)
    return (
      <div className="space-y-4 mt-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-slate-100 rounded-2xl animate-pulse" />
        ))}
      </div>
    );

  if (!group)
    return <p className="text-sm text-red-500 mt-8">Group not found</p>;

  const hasBalance = Object.values(myBalances).some((b) => b !== 0n);

  const primaryDebt = [0, 1, 2]
    .map((t) => ({ t, bal: myBalances[t] ?? 0n }))
    .filter(({ bal }) => bal < 0n)
    .sort((a, b) => (a.bal < b.bal ? -1 : 1))[0] ?? null;

  const primaryOwed = [0, 1, 2]
    .map((t) => ({ t, bal: myBalances[t] ?? 0n }))
    .filter(({ bal }) => bal > 0n)
    .sort((a, b) => (a.bal > b.bal ? -1 : 1))[0] ?? null;

  const heroBalance = primaryDebt ?? primaryOwed;

  return (
    <div className="space-y-6">
      <div className="flex items-start w-full justify-between">
        <div className="mt-8">
          <Link
            href="/groups"
            className="text-xs font-semibold uppercase tracking-widest text-pink-500"
          >
            ← All Groups
          </Link>
          <h1 className="text-3xl font-bold text-slate-900 mt-1">{group.name}</h1>
        </div>

        <div className="flex items-center gap-3  mt-10">
          <div className="flex -space-x-2">
            {group.members.slice(0, 4).map((m) => (
              <div
                key={m}
                title={m}
                className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center"
              >
                <span className="text-xs font-semibold text-slate-600 font-mono">
                  {m.slice(2, 4).toUpperCase()}
                </span>
              </div>
            ))}
            {group.members.length > 4 && (
              <div className="w-8 h-8 rounded-full bg-pink-100 border-2 border-white flex items-center justify-center">
                <span className="text-xs font-semibold text-pink-600">
                  +{group.members.length - 4}
                </span>
              </div>
            )}
          </div>

          <button
            onClick={() => setExpenseModalOpen(true)}
            className="border border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-slate-50 transition"
          >
            Expense
          </button>
          <button
            onClick={() => setSettleModalOpen(true)}
            className="bg-pink-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-pink-700 transition"
          >
            Settle
          </button>
        </div>
      </div>

      <div className="bg-slate-300 rounded-2xl px-8 py-6 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-slate-900 mb-1">
            Your Standing
          </p>
          {!hasBalance ? (
            <p className="text-xl font-bold text-emerald-400">All Settled ✓</p>
          ) : heroBalance ? (
            <p className={`text-xl font-bold ${heroBalance.bal < 0n ? "text-red-600" : "text-emerald-600"}`}>
              {heroBalance.bal < 0n ? "You owe " : "Owed to you "}
              {formatAmount(heroBalance.bal < 0n ? -heroBalance.bal : heroBalance.bal, heroBalance.t)}
            </p>
          ) : null}
        </div>
        <div className="flex gap-10 text-right">
          <div>
            <p className="text-xs uppercase tracking-widest text-slate-900 mb-1">
              Total Expenses
            </p>
            <p className="text-xl font-bold text-grey-100">{expenses.length}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-slate-900 mb-1">
              Group Split
            </p>
            <p className="text-xl font-bold text-grey-100">
              {group.members.length} Members
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-6">

        <div className="col-span-3 space-y-4">

          <GroupChat
            groupId={groupId}
            expenses={expenses.map((e): ExpenseFeedItem => ({
              id: e.id.toString(),
              paidBy: e.paidBy,
              description: e.description,
              totalAmount: e.totalAmount,
              tokenType: e.tokenType,
              timestamp: Number(e.timestamp),
            }))}
          />
        </div>

        <div className="col-span-2">
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-800">Members</p>
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                {group.members.length} total
              </span>
            </div>

            <div className="divide-y divide-slate-50">
              {group.members.map((m) => {
                const isMe = m.toLowerCase() === address?.toLowerCase();
                return (
                  <div key={m} className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-semibold text-slate-600 font-mono">
                          {m.slice(2, 4).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800 font-mono">
                          {m.slice(0, 6)}...{m.slice(-4)}
                        </p>
                        {isMe && (
                          <p className="text-xs text-pink-500">you</p>
                        )}
                      </div>
                    </div>
                    {isMe && (
                      <div className="text-right">
                        {!hasBalance ? (
                          <div>
                            <p className="text-xs uppercase tracking-wide text-slate-400">settled</p>
                            <p className="text-sm font-semibold text-slate-400">—</p>
                          </div>
                        ) : primaryDebt ? (
                          <div>
                            <p className="text-xs uppercase tracking-wide text-slate-400">you owe</p>
                            <p className="text-xs font-semibold text-red-500">
                              {formatAmount(-primaryDebt.bal, primaryDebt.t)}
                            </p>
                          </div>
                        ) : primaryOwed ? (
                          <div>
                            <p className="text-xs uppercase tracking-wide text-slate-400">owes you</p>
                            <p className="text-xs font-semibold text-emerald-600">
                              {formatAmount(primaryOwed.bal, primaryOwed.t)}
                            </p>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="px-4 py-3 border-t border-slate-100">
              <p className="text-xs text-center text-slate-400">
                Group #{group.name}
              </p>
            </div>
          </div>
        </div>
      </div>
      {expenseModalOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-md supports-[backdrop-filter]:bg-slate-950/40"
            onClick={() => setExpenseModalOpen(false)}
          >
            <div
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-semibold text-slate-900">÷ Add Expense</h2>
                <button
                  onClick={() => setExpenseModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 text-xl leading-none"
                >
                  ×
                </button>
              </div>
              <GroupSplitPanel
                groupId={BigInt(groupId)}
                members={group.members}
                onSuccess={() => setExpenseModalOpen(false)}
              />
            </div>
          </div>,
          document.body
        )}
      {settleModalOpen && (
        <SettleModal
          groupId={groupId}
          onClose={() => setSettleModalOpen(false)}
        />
      )}
    </div>
  );
}
