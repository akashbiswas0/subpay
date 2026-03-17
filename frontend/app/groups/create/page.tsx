"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useGroupSplit } from "@/hooks/useGroupSplit";

export default function CreateGroupPage() {
  const { isConnected } = useAccount();
  const router = useRouter();
  const { status, error, handleCreateGroup, reset } = useGroupSplit();

  const [name, setName] = useState("");
  const [memberInput, setMemberInput] = useState("");
  const [members, setMembers] = useState<string[]>([]);

  function addMember() {
    const addr = memberInput.trim();
    if (!addr.startsWith("0x") || addr.length !== 42) return;
    if (members.includes(addr)) return;
    setMembers([...members, addr]);
    setMemberInput("");
  }

  function removeMember(addr: string) {
    setMembers(members.filter((m) => m !== addr));
  }

  async function handleSubmit() {
    if (!name.trim()) return;
    reset();
    const groupId = await handleCreateGroup(name.trim(), members);
    if (groupId !== null) {
      router.push(`/groups/${groupId.toString()}`);
    }
  }

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center gap-4 mt-12">
        <ConnectButton />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <div className="bg-white rounded-3xl shadow-md border border-slate-100 w-full max-w-lg px-8 py-8 space-y-6">
        <div className="border-b border-slate-100 pb-5">
          <h1 className="text-3xl font-semibold text-slate-900">Create Group</h1>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm text-slate-600">Group name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Goa Trip, Flatmates"
            className="w-full border border-blue-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-400 transition"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-slate-600">
            Add members (wallet addresses)
          </label>
          <div className="flex gap-2">
            <input
              value={memberInput}
              onChange={(e) => setMemberInput(e.target.value)}
              placeholder="0x..."
              className="flex-1 border border-blue-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-400 transition"
              onKeyDown={(e) => e.key === "Enter" && addMember()}
            />
            <button
              onClick={addMember}
              className="border border-blue-300 text-blue-500 rounded-xl px-5 py-2.5 text-sm font-semibold hover:bg-blue-50 transition"
            >
              Add
            </button>
          </div>

          {members.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {members.map((m) => (
                <div
                  key={m}
                  className="flex items-center gap-1.5 border border-slate-200 rounded-xl px-3 py-1.5 text-sm text-slate-700 bg-white"
                >
                  <span className="font-mono">
                    {m.slice(0, 6)}...{m.slice(-4)}
                  </span>
                  <button
                    onClick={() => removeMember(m)}
                    className="text-slate-400 hover:text-slate-600 transition leading-none"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <p className="text-xs text-slate-400">
            You are added as a member automatically
          </p>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}
        {status === "pending" && (
          <p className="text-sm text-blue-500">Creating group...</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={!name.trim() || status === "pending"}
          className="w-full bg-pink-600 hover:bg-pink-700 text-white rounded-full py-3.5 text-sm font-semibold disabled:opacity-50 transition"
        >
          {status === "pending" ? "Creating..." : "Create Group"}
        </button>
      </div>
    </div>
  );
}
