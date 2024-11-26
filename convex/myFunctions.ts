import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { Color, ConvexTypeColor, MomentBlock } from "./utils";
import { deleteMomentBlock, fillRawMomentBlock } from "./blocks";

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
    color?: Color;
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
      rawMomentBlocks.map((block) =>
        fillRawMomentBlock(ctx, {
          momentBlockId: block._id,
          momentBlockCreationTime: block._creationTime,
          momentBlockType: block.type,
        })
      )
    );

    return {
      _id: rawMoment._id,
      name: rawMoment.name,
      displayName: rawMoment.displayName,
      color: rawMoment.color,
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
      displayName: "",
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

export const getDisplayProps = query({
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
      color: moment.color,
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

export const updateColor = mutation({
  args: {
    momentId: v.id("moments"),
    color: v.optional(ConvexTypeColor),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.momentId, {
      color: args.color,
    });
  },
});
