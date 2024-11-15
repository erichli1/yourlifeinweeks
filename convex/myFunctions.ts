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

    return await ctx.db
      .query("moments")
      .filter((q) =>
        q.and(
          q.eq(q.field("year"), args.year),
          q.eq(q.field("week"), args.week)
        )
      )
      .collect();
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
    });
  },
});
