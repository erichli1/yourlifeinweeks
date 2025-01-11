"use client";

import { WrapInTooltip } from "@/app/helpers/components";
import { Button } from "@/components/ui/button";
import { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import { TrashIcon } from "lucide-react";

export function DeleteMoment({ momentId }: { momentId: Id<"moments"> }) {
  const deleteMoment = useMutation(api.myFunctions.deleteMoment);

  return (
    <WrapInTooltip text="Delete moment" delayDuration={0} asChild>
      <Button
        variant="outline"
        size="icon"
        onClick={() => {
          deleteMoment({ momentId }).catch(console.error);
        }}
        className="h-8 w-8"
      >
        <TrashIcon className="w-4 h-4" />
      </Button>
    </WrapInTooltip>
  );
}
