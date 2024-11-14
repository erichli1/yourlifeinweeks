import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema(
  {
    users: defineTable({
      name: v.string(),
      birthday: v.number(),
      tokenIdentifier: v.string(),
    }),
  },
  { schemaValidation: true }
);
