import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

export const ConvexTypeMomentBlockType = v.union(
  v.literal("journal"),
  v.literal("images")
);

export type MomentBlock = RawMomentBlock & (JournalBlock | ImagesBlock);

export type RawMomentBlock = {
  momentBlockCreationTime: number;
  momentBlockId: Id<"momentBlocks">;
};

export type MomentBlock_Journal = RawMomentBlock & JournalBlock;
export type MomentBlock_Images = RawMomentBlock & ImagesBlock;

type JournalBlock = {
  type: "journal";
  journalBlockId: Id<"journalBlocks">;
  entry: string;
};

type ImagesBlock = {
  type: "images";
  imagesBlockId: Id<"imagesBlocks">;
  images: Array<Image>;
};

type Image = {
  imageId: Id<"images">;
  url: string;
};
