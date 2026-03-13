import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  messages: defineTable({
    groupId: v.string(),
    sender: v.string(),
    senderShort: v.string(),
    text: v.string(),
    timestamp: v.number(),
  })
    .index("by_group", ["groupId"])
    .index("by_group_timestamp", ["groupId", "timestamp"]),

  paymentLinks: defineTable({
    to: v.string(),
    amount: v.string(),
    token: v.string(),
    memo: v.string(),
  }),
});
