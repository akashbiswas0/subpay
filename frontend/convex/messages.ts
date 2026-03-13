import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getMessages = query({
  args: { groupId: v.string() },
  handler: async (ctx, { groupId }) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_group_timestamp", (q) => q.eq("groupId", groupId))
      .order("asc")
      .take(100);
  },
});

export const sendMessage = mutation({
  args: {
    groupId: v.string(),
    sender: v.string(),
    senderShort: v.string(),
    text: v.string(),
  },
  handler: async (ctx, { groupId, sender, senderShort, text }) => {
    if (!text.trim()) throw new Error("Message cannot be empty");
    if (text.length > 500) throw new Error("Message too long");
    await ctx.db.insert("messages", {
      groupId,
      sender,
      senderShort,
      text: text.trim(),
      timestamp: Date.now(),
    });
  },
});
