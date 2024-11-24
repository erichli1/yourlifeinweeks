import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx, _args) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const saveStorageId = mutation({
  args: {
    storageId: v.id("_storage"),
    imagesBlockId: v.id("imagesBlocks"),
  },
  handler: async (ctx, { storageId, imagesBlockId }) => {
    await ctx.db.insert("images", {
      imagesBlockId,
      storageId,
    });
  },
});
