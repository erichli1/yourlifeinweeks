import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { ConvexTypeColor, ConvexTypeMomentBlockType } from "./utils";

export default defineSchema(
  {
    users: defineTable({
      name: v.string(),
      tokenIdentifier: v.string(),
      activeAccountId: v.id("accounts"),
    }),
    userAccounts: defineTable({
      userId: v.id("users"),
      accountId: v.id("accounts"),
    }),
    accounts: defineTable({
      name: v.string(),
      birthday: v.number(),
    }),
    moments: defineTable({
      accountId: v.id("accounts"),
      year: v.number(),
      week: v.number(),
      name: v.string(),
      displayName: v.string(),
      color: v.optional(ConvexTypeColor),
    }),
    momentBlocks: defineTable({
      momentId: v.id("moments"),
      type: ConvexTypeMomentBlockType,
    }),
    journalBlocks: defineTable({
      momentBlockId: v.id("momentBlocks"),
      entry: v.string(),
    }).index("by_moment_block_id", ["momentBlockId"]),
    imagesBlocks: defineTable({
      momentBlockId: v.id("momentBlocks"),
    }).index("by_moment_block_id", ["momentBlockId"]),
    images: defineTable({
      imagesBlockId: v.id("imagesBlocks"),
      storageId: v.id("_storage"),
    }),
  },
  { schemaValidation: true }
);
