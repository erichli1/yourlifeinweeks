import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { ConvexTypeMomentBlockType, MomentBlock } from "./utils";

export const updateJournalBlock = mutation({
  args: {
    journalBlockId: v.id("journalBlocks"),
    entry: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.journalBlockId, {
      entry: args.entry,
    });
  },
});

export const createJournalBlock = mutation({
  args: {
    momentId: v.id("moments"),
  },
  handler: async (ctx, args) => {
    const momentBlockId = await ctx.db.insert("momentBlocks", {
      momentId: args.momentId,
      type: "journal",
    });

    await ctx.db.insert("journalBlocks", {
      momentBlockId,
      entry: "",
    });
  },
});

export const createImagesBlock = mutation({
  args: {
    momentId: v.id("moments"),
  },
  handler: async (ctx, args) => {
    const momentBlockId = await ctx.db.insert("momentBlocks", {
      momentId: args.momentId,
      type: "images",
    });

    await ctx.db.insert("imagesBlocks", {
      momentBlockId,
    });
  },
});

export const deleteMomentBlock = mutation({
  args: {
    momentBlockId: v.id("momentBlocks"),
  },
  handler: async (ctx, args) => {
    const momentBlock = await ctx.db.get(args.momentBlockId);
    if (!momentBlock) throw new Error("MomentBlockNotFound");

    switch (momentBlock.type) {
      case "journal":
        const journalBlock = await ctx.db
          .query("journalBlocks")
          .withIndex("by_moment_block_id", (q) =>
            q.eq("momentBlockId", args.momentBlockId)
          )
          .unique();
        if (!journalBlock) throw new Error("JournalBlockNotFound");

        await ctx.db.delete(journalBlock._id);
        break;

      case "images":
        const imagesBlock = await ctx.db
          .query("imagesBlocks")
          .filter((q) => q.eq(q.field("momentBlockId"), args.momentBlockId))
          .unique();
        if (!imagesBlock) throw new Error("ImagesBlockNotFound");

        const images = await ctx.db
          .query("images")
          .filter((q) => q.eq(q.field("imagesBlockId"), imagesBlock._id))
          .collect();

        await Promise.all(
          images.map((image) => ctx.storage.delete(image.storageId))
        );
        await Promise.all(images.map((image) => ctx.db.delete(image._id)));
        await ctx.db.delete(imagesBlock._id);
        break;

      default:
        const _exhaustiveCheck: never = momentBlock.type;
        throw new Error(
          `Found unknown moment block type ${_exhaustiveCheck} when deleting moment block`
        );
    }

    await ctx.db.delete(args.momentBlockId);
  },
});

export const fillRawMomentBlock = query({
  args: {
    momentBlockId: v.id("momentBlocks"),
    momentBlockCreationTime: v.number(),
    momentBlockType: ConvexTypeMomentBlockType,
  },
  handler: async (
    ctx,
    { momentBlockId, momentBlockCreationTime, momentBlockType }
  ): Promise<MomentBlock> => {
    switch (momentBlockType) {
      case "journal":
        const journalBlock = await ctx.db
          .query("journalBlocks")
          .withIndex("by_moment_block_id", (q) =>
            q.eq("momentBlockId", momentBlockId)
          )
          .unique();
        if (!journalBlock) throw new Error("JournalBlockNotFound");

        return {
          momentBlockCreationTime,
          momentBlockId,
          type: "journal",
          journalBlockId: journalBlock._id,
          entry: journalBlock.entry,
        };

      case "images":
        const imagesBlock = await ctx.db
          .query("imagesBlocks")
          .filter((q) => q.eq(q.field("momentBlockId"), momentBlockId))
          .unique();
        if (!imagesBlock) throw new Error("ImagesBlockNotFound");

        const rawImages = await ctx.db
          .query("images")
          .filter((q) => q.eq(q.field("imagesBlockId"), imagesBlock._id))
          .collect();

        const images = await Promise.all(
          rawImages.map(async (rawImage) => {
            const url = await ctx.storage.getUrl(rawImage.storageId);
            if (!url) throw new Error("ImageUrlNotFound");

            return {
              imageId: rawImage._id,
              url,
            };
          })
        );

        return {
          momentBlockCreationTime,
          momentBlockId,
          type: "images",
          imagesBlockId: imagesBlock._id,
          images,
        };

      default:
        const _exhaustiveCheck: never = momentBlockType;
        throw new Error(
          `Found unknown moment block type ${_exhaustiveCheck} when filling raw moment block`
        );
    }
  },
});
