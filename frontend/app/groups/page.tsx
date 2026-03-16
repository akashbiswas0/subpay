"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";
import { useGroupSplit } from "@/hooks/useGroupSplit";
import { GroupInfo } from "@/utils/groupContract";

export default function GroupsPage() {
  const { address, isConnected } = useAccount();
  const { fetchMyGroups } = useGroupSplit();
  const [groups, setGroups] = useState<GroupInfo[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!address) return;
    setLoading(true);
    fetchMyGroups(address)
      .then(setGroups)
      .finally(() => setLoading(false));
  }, [address]);

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center gap-4 mt-16 text-center">
        <p className="text-gray-500 text-sm">
          Connect your wallet to see your groups
        </p>
        <ConnectButton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mt-10">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Groups</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            On-chain groups — split expenses and chat in real time
          </p>
        </div>
        <Link
          href="/groups/create"
          className="bg-pink-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-pink-700 transition"
        >
          + New Group
        </Link>
      </div>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      )}

      {!loading && groups.length === 0 && (
        <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-2xl">
          <p className="text-2xl mb-2">◈</p>
          <p className="text-slate-500 text-sm">No groups yet</p>
          <p className="text-slate-400 text-xs mt-1">
            Create a group to start splitting expenses and chatting
          </p>
          <Link
            href="/groups/create"
            className="inline-block mt-4 text-pink-600 text-sm underline"
          >
            Create your first group
          </Link>
        </div>
      )}

      <div className="space-y-4">
        {groups.map((group) => (
          <Link
            key={group.id.toString()}
            href={`/groups/${group.id.toString()}`}
            className="block bg-white border border-slate-100 rounded-3xl px-6 py-5 hover:shadow-md transition shadow-sm"
          >
            {/* Top row: name + badge */}
            <div className="flex items-start justify-between">
              <p className="text-2xl font-bold text-slate-900">{group.name}</p>
              <div className="flex items-center gap-1 text-xs bg-pink-50 text-pink-600 px-3 py-1 rounded-full font-medium">
                Group #{group.id.toString()}
                <span className="ml-1">→</span>
              </div>
            </div>

            {/* Bottom row: avatars left, stats right */}
            <div className="flex items-end justify-between mt-4">
              <div className="flex -space-x-2">
                {group.members.slice(0, 5).map((member) => (
                  <div
                    key={member}
                    className="w-9 h-9 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center"
                    title={member}
                  >
                    <span className="text-xs text-slate-500 font-mono font-semibold">
                      {member.slice(2, 4).toUpperCase()}
                    </span>
                  </div>
                ))}
                {group.members.length > 5 && (
                  <div className="w-9 h-9 rounded-full bg-pink-100 border-2 border-white flex items-center justify-center">
                    <span className="text-xs text-pink-600 font-semibold">
                      +{group.members.length - 5}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-slate-900">{group.members.length}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Members</p>
                </div>
                <span className="text-slate-300 text-lg">·</span>
                <div className="text-center">
                  <p className="text-2xl font-bold text-slate-900">{group.expenseIds.length}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {group.expenseIds.length === 1 ? "Expense" : "Expenses"}
                  </p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
