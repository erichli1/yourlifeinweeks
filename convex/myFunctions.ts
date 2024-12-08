import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { Color, ConvexTypeColor, MomentBlock } from "./utils";
import { deleteMomentBlock, fillRawMomentBlock } from "./blocks";

export const getAccount = query({
  args: {},
  handler: async (ctx) => {
    const authenticatedUser = await ctx.auth.getUserIdentity();
    if (!authenticatedUser) throw new Error("User is not authenticated");

    const user = await ctx.db
      .query("users")
      .filter((q) =>
        q.eq(q.field("tokenIdentifier"), authenticatedUser.tokenIdentifier)
      )
      .unique();
    if (!user) return null;

    return await ctx.db.get(user.activeAccountId);
  },
});

export const initializeUserAndAccount = mutation({
  args: {
    name: v.string(),
    birthday: v.number(),
  },
  handler: async (ctx, args) => {
    const authenticatedUser = await ctx.auth.getUserIdentity();
    if (!authenticatedUser) throw new Error("NotAuthenticated");

    const accountId = await ctx.db.insert("accounts", {
      name: args.name,
      birthday: args.birthday,
    });

    const userId = await ctx.db.insert("users", {
      name: args.name,
      tokenIdentifier: authenticatedUser.tokenIdentifier,
      activeAccountId: accountId,
    });

    await ctx.db.insert("userAccounts", {
      userId,
      accountId,
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
    const account = await getAccount(ctx, {});
    if (!account) throw new Error("No account found");

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
    const account = await getAccount(ctx, {});
    if (!account) throw new Error("No account found");

    await ctx.db.insert("moments", {
      accountId: account._id,
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

    const account = await getAccount(ctx, {});
    if (!account) return [];

    const moments = await ctx.db
      .query("moments")
      .filter((q) => q.eq(q.field("accountId"), account._id))
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
