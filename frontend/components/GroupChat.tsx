"use client";
import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { useAccount } from "wagmi";
import { api } from "@/convex/_generated/api";

export interface ExpenseFeedItem {
  id: string;
  paidBy: string;
  description: string;
  totalAmount: bigint;
  tokenType: number;
  timestamp: number; 
}

interface GroupChatProps {
  groupId: string;
  expenses?: ExpenseFeedItem[];
}

interface ChatMessage {
  _id: string;
  sender: string;
  senderShort: string;
  text: string;
  timestamp: number; 
}

const TOKEN_LABELS = ["PAS", "USDt", "USDC"];
const TOKEN_DECIMALS = [10, 6, 6];

function formatAmount(amount: bigint, tokenType: number): string {
  const decimals = TOKEN_DECIMALS[tokenType] ?? 10;
  const val = Number(amount) / Math.pow(10, decimals);
  return `${val.toFixed(4)} ${TOKEN_LABELS[tokenType]}`;
}

type FeedItem =
  | { kind: "message"; data: ChatMessage; ts: number }
  | { kind: "expense"; data: ExpenseFeedItem; ts: number };

export default function GroupChat({ groupId, expenses = [] }: GroupChatProps) {
  const { address } = useAccount();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const messages = useQuery(api.messages.getMessages, { groupId }) as ChatMessage[] | undefined;
  const sendMessage = useMutation(api.messages.sendMessage);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, expenses]);

  async function handleSend() {
    if (!text.trim() || !address || sending) return;
    setSending(true);
    try {
      await sendMessage({
        groupId,
        sender: address,
        senderShort: `${address.slice(0, 6)}...${address.slice(-4)}`,
        text: text.trim(),
      });
      setText("");
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const isMe = (sender: string) =>
    sender.toLowerCase() === address?.toLowerCase();

  const feed: FeedItem[] = [
    ...(messages ?? []).map((m) => ({ kind: "message" as const, data: m, ts: m.timestamp })),
    ...expenses.map((e) => ({ kind: "expense" as const, data: e, ts: e.timestamp * 1000 })),
  ].sort((a, b) => a.ts - b.ts);

  return (
    <div className="flex flex-col bg-white border border-slate-200 rounded-2xl overflow-hidden" style={{ height: "32rem" }}>
      <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-green-400" />
        <p className="text-sm font-semibold text-slate-700">Activity Feed</p>
        <span className="text-xs text-slate-400 ml-auto">
          {(messages?.length ?? 0) + expenses.length} items
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages === undefined && (
          <p className="text-xs text-slate-400 text-center py-4">Loading...</p>
        )}
        {feed.length === 0 && messages !== undefined && (
          <p className="text-xs text-slate-400 text-center py-4">
            No activity yet. Say hello or add an expense!
          </p>
        )}
        {feed.map((item) => {
          if (item.kind === "expense") {
            const exp = item.data;
            return (
              <div key={`exp-${exp.id}`} className="flex items-start gap-3 py-1">
                <div className="w-9 h-9 rounded-full bg-pink-50 border border-pink-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-pink-500 font-mono">
                    {exp.paidBy.slice(2, 4).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-400 mb-1">Added an expense</p>
                  <div className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-800 truncate">
                        {exp.description}
                      </p>
                      <span className="text-sm font-bold text-pink-600 whitespace-nowrap">
                        {formatAmount(exp.totalAmount, exp.tokenType)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Paid by {exp.paidBy.slice(0, 6)}...{exp.paidBy.slice(-4)}
                      {" · "}
                      {new Date(exp.timestamp * 1000).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            );
          }

          const msg = item.data;
          const me = isMe(msg.sender);
          return (
            <div
              key={msg._id}
              className={`flex flex-col ${me ? "items-end" : "items-start"}`}
            >
              {!me && (
                <span className="text-xs text-slate-400 mb-1 px-1">
                  {msg.senderShort}
                </span>
              )}
              <div
                className={`max-w-xs px-3 py-2 rounded-2xl text-sm ${
                  me
                    ? "bg-pink-600 text-white rounded-br-sm"
                    : "bg-slate-100 text-slate-800 rounded-bl-sm"
                }`}
              >
                {msg.text}
              </div>
              <span className="text-xs text-slate-300 mt-1 px-1">
                {new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {address ? (
        <div className="px-3 py-3 border-t border-slate-100 flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Send a message or add a quick expense..."
            maxLength={500}
            className="flex-1 text-sm bg-slate-50 rounded-xl px-3 py-2 outline-none border border-slate-200 focus:border-pink-300 transition"
          />
          <button
            onClick={handleSend}
            disabled={!text.trim() || sending}
            className="bg-pink-600 text-white px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50 hover:bg-pink-700 transition"
          >
            {sending ? "..." : "Send →"}
          </button>
        </div>
      ) : (
        <div className="px-4 py-3 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-400">
            Connect wallet to send messages
          </p>
        </div>
      )}
    </div>
  );
}
