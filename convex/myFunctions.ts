import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { Color, ConvexTypeColor, isNotNull, MomentBlock } from "./utils";
import { deleteMomentBlock, fillRawMomentBlock } from "./blocks";

const getUser = query({
  args: {},
  handler: async (ctx) => {
    const authenticatedUser = await ctx.auth.getUserIdentity();
    if (!authenticatedUser) throw new Error("User is not authenticated");

    return await ctx.db
      .query("users")
      .filter((q) =>
        q.eq(q.field("tokenIdentifier"), authenticatedUser.tokenIdentifier)
      )
      .unique();
  },
});

export const getActiveAccount = query({
  args: {},
  handler: async (ctx) => {
    const user = await getUser(ctx, {});
    if (!user) return null;

    return await ctx.db.get(user.activeAccountId);
  },
});

export const changeActiveAccount = mutation({
  args: {
    accountId: v.id("accounts"),
  },
  handler: async (ctx, args) => {
    const user = await getUser(ctx, {});
    if (!user) throw new Error("User does not exist");

    await ctx.db.patch(user._id, {
      activeAccountId: args.accountId,
    });
  },
});

export const getAccountsForUser = query({
  args: {},
  handler: async (ctx) => {
    const user = await getUser(ctx, {});
    if (!user) throw new Error("User does not exist");

    const userAccounts = await ctx.db
      .query("userAccounts")
      .filter((q) => q.eq(q.field("userId"), user._id))
      .collect();

    const accounts = await Promise.all(
      userAccounts.map((ua) => ctx.db.get(ua.accountId))
    );

    return accounts.filter(isNotNull);
  },
});

export const createNewAccountForExistingUser = mutation({
  args: {
    name: v.string(),
    birthday: v.number(),
  },
  handler: async (ctx, { name, birthday }) => {
    const user = await getUser(ctx, {});
    if (!user) throw new Error("User does not exist");

    const accountId = await ctx.db.insert("accounts", {
      name,
      birthday,
    });

    await ctx.db.insert("userAccounts", {
      userId: user._id,
      accountId,
    });

    await changeActiveAccount(ctx, { accountId });
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
    const account = await getActiveAccount(ctx, {});
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
    const account = await getActiveAccount(ctx, {});
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

    const account = await getActiveAccount(ctx, {});
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
