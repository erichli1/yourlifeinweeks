import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { ConvexTypeMomentBlockType } from "./utils";

export default defineSchema(
  {
    users: defineTable({
      name: v.string(),
      birthday: v.number(),
      tokenIdentifier: v.string(),
    }),
    moments: defineTable({
      userId: v.id("users"),
      year: v.number(),
      week: v.number(),
      name: v.string(),
      displayName: v.string(),
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
