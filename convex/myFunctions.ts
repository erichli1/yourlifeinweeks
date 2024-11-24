import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

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

export const getMomentsForYearWeek = query({
  args: {
    year: v.number(),
    week: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await getUser(ctx, {});
    if (!user) throw new Error("NoCreatedAccount");

    const rawMoments = await ctx.db
      .query("moments")
      .filter((q) =>
        q.and(
          q.eq(q.field("year"), args.year),
          q.eq(q.field("week"), args.week)
        )
      )
      .collect();

    const moments = await Promise.all(
      rawMoments.map(async (rawMoment) => {
        const journalEntries = await ctx.db
          .query("journalEntries")
          .filter((q) => q.eq(q.field("momentId"), rawMoment._id))
          .collect();

        return { ...rawMoment, journalEntries };
      })
    );

    return moments;
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
    const journalEntries = await ctx.db
      .query("journalEntries")
      .filter((q) => q.eq(q.field("momentId"), args.momentId))
      .collect();

    await Promise.all(
      journalEntries.map((journalEntry) => ctx.db.delete(journalEntry._id))
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

export const updateJournalEntry = mutation({
  args: {
    journalEntryId: v.id("journalEntries"),
    entry: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.journalEntryId, {
      entry: args.entry,
    });
  },
});

export const createJournalEntry = mutation({
  args: {
    momentId: v.id("moments"),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("journalEntries", {
      momentId: args.momentId,
      entry: "",
    });
  },
});

export const deleteJournalEntry = mutation({
  args: {
    journalEntryId: v.id("journalEntries"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.journalEntryId);
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
