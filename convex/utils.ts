import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

export const ConvexTypeMomentBlockType = v.union(
  v.literal("journal"),
  v.literal("images")
);

export type CommonMomentBlockType = {
  _creationTime: number;
  _id: Id<"momentBlocks">;
};

export type MomentBlockType = CommonMomentBlockType &
  (JournalBlockType | ImagesBlockType);

export type JournalBlockType = {
  type: "journal";
  journalBlockId: Id<"journalBlocks">;
  entry: string;
};

export type ImagesBlockType = {
  type: "images";
  imagesBlockId: Id<"imagesBlocks">;
};
