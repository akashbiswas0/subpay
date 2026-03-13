import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

export const createLink = mutation({
  args: {
    to: v.string(),
    amount: v.string(),
    token: v.string(),
    memo: v.string(),
  },
  handler: async (ctx, { to, amount, token, memo }) => {
    const id = await ctx.db.insert("paymentLinks", { to, amount, token, memo });
    return id;
  },
});

export const getLink = query({
  args: { id: v.string() },
  handler: async (ctx, { id }) => {
    try {
      const doc = await ctx.db.get(id as Id<"paymentLinks">);
      return doc ?? null;
    } catch {
      return null;
    }
  },
});
