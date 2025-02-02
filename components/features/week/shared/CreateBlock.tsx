"use client";

import { Button } from "@/components/ui/button";
import { ImagesIcon, NotebookPenIcon } from "lucide-react";
import React from "react";
import { WrapInTooltip } from "@/components/shared/WrapInTooltip";
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import { Id } from "@/convex/_generated/dataModel";

export function CreateJournalBlock({ momentId }: { momentId: Id<"moments"> }) {
  const createJournalBlock = useMutation(api.blocks.createJournalBlock);

  return (
    <WrapInTooltip text="Add journal entry" delayDuration={0} asChild>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          createJournalBlock({ momentId }).catch(console.error);
        }}
      >
        <NotebookPenIcon className="w-4 h-4 mr-1" />
        Journal
      </Button>
    </WrapInTooltip>
  );
}

export function CreateImagesBlock({ momentId }: { momentId: Id<"moments"> }) {
  const createImagesBlock = useMutation(api.blocks.createImagesBlock);

  return (
    <WrapInTooltip text="Add images" delayDuration={0} asChild>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          createImagesBlock({ momentId }).catch(console.error);
        }}
      >
        <ImagesIcon className="w-4 h-4 mr-1" />
        Images
      </Button>
    </WrapInTooltip>
  );
}
