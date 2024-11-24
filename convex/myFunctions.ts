import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { MomentBlock } from "./utils";

export const getUser = query({
  args: {},
  handler: async (ctx) => {
    const authenticatedUser = await ctx.auth.getUserIdentity();
    if (!authenticatedUser) throw new Error("NotAuthenticated");

    return await ctx.db
      .query("users")
      .filter((q) =>
        q.eq(q.field("tokenIdentifier"), authenticatedUser.tokenIdentifier)
      )
      .unique();
  },
});

export const createUser = mutation({
  args: {
    name: v.string(),
    birthday: v.number(),
  },
  handler: async (ctx, args) => {
    const authenticatedUser = await ctx.auth.getUserIdentity();
    if (!authenticatedUser) throw new Error("NotAuthenticated");

    await ctx.db.insert("users", {
      name: args.name,
      birthday: args.birthday,
      tokenIdentifier: authenticatedUser.tokenIdentifier,
    });
  },
});

export const getMomentForYearWeek = query({
  args: {
    year: v.number(),
    week: v.number(),
  },
  handler: async (
    ctx,
    args
  ): Promise<{
    _id: Id<"moments">;
    name: string;
    displayName: string;
    momentBlocks: MomentBlock[];
  } | null> => {
    const user = await getUser(ctx, {});
    if (!user) throw new Error("NoCreatedAccount");

    const rawMoment = await ctx.db
      .query("moments")
      .filter((q) =>
        q.and(
          q.eq(q.field("year"), args.year),
          q.eq(q.field("week"), args.week)
        )
      )
      .unique();

    if (!rawMoment) return null;

    const rawMomentBlocks = await ctx.db
      .query("momentBlocks")
      .filter((q) => q.eq(q.field("momentId"), rawMoment._id))
      .collect();

    const momentBlocks: MomentBlock[] = await Promise.all(
      rawMomentBlocks.map(async (block) => {
        switch (block.type) {
          case "journal":
            const journalBlock = await ctx.db
              .query("journalBlocks")
              .withIndex("by_moment_block_id", (q) =>
                q.eq("momentBlockId", block._id)
              )
              .unique();
            if (!journalBlock) throw new Error("JournalBlockNotFound");

            return {
              momentBlockCreationTime: block._creationTime,
              momentBlockId: block._id,
              type: "journal",
              journalBlockId: journalBlock._id,
              entry: journalBlock.entry,
            };

          case "images":
            const imagesBlock = await ctx.db
              .query("imagesBlocks")
              .filter((q) => q.eq(q.field("momentBlockId"), block._id))
              .unique();
            if (!imagesBlock) throw new Error("ImagesBlockNotFound");

            return {
              momentBlockCreationTime: block._creationTime,
              momentBlockId: block._id,
              type: "images",
              imagesBlockId: imagesBlock._id,
            };

          default:
            const _exhaustiveCheck: never = block.type;
            throw new Error(
              `Found unknown moment block type ${_exhaustiveCheck} when retrieving moment blocks`
            );
        }
      })
    );

    return {
      _id: rawMoment._id,
      name: rawMoment.name,
      displayName: rawMoment.displayName,
      momentBlocks,
    };
  },
});

export const createMomentForYearWeek = mutation({
  args: {
    year: v.number(),
    week: v.number(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getUser(ctx, {});
    if (!user) throw new Error("NoCreatedAccount");

    await ctx.db.insert("moments", {
      userId: user._id,
      year: args.year,
      week: args.week,
      name: args.name,
      displayName: "🎉",
    });
  },
});

export const deleteMoment = mutation({
  args: {
    momentId: v.id("moments"),
  },
  handler: async (ctx, args) => {
    const momentBlocks = await ctx.db
      .query("momentBlocks")
      .filter((q) => q.eq(q.field("momentId"), args.momentId))
      .collect();

    await Promise.all(
      momentBlocks.map((block) =>
        deleteMomentBlock(ctx, { momentBlockId: block._id })
      )
    );

    await ctx.db.delete(args.momentId);
  },
});

export const renameMoment = mutation({
  args: {
    momentId: v.id("moments"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.momentId, {
      name: args.name,
    });
  },
});

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
    const momentBlock = await ctx.db.insert("momentBlocks", {
      momentId: args.momentId,
      type: "journal",
    });

    await ctx.db.insert("journalBlocks", {
      momentBlockId: momentBlock,
      entry: "",
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

export const getDisplayNames = query({
  args: {},
  handler: async (ctx) => {
    const convexUser = await ctx.auth.getUserIdentity();
    if (!convexUser) return [];

    const user = await getUser(ctx, {});
    if (!user) return [];

    const moments = await ctx.db
      .query("moments")
      .filter((q) => q.eq(q.field("userId"), user._id))
      .collect();

    return moments.map((moment) => ({
      displayName: moment.displayName,
      year: moment.year,
      week: moment.week,
    }));
  },
});

export const updateDisplayName = mutation({
  args: {
    momentId: v.id("moments"),
    displayName: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.momentId, {
      displayName: args.displayName,
    });
  },
});
