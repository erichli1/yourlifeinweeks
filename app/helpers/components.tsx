import React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function WrapInTooltip({
  children,
  text,
}: {
  children: React.ReactNode;
  text: string;
}) {
  return (
    <Tooltip delayDuration={50}>
      <TooltipTrigger>{children}</TooltipTrigger>
      <TooltipContent className="bg-background shadow-md text-primary border-input">
        <p>{text}</p>
      </TooltipContent>
    </Tooltip>
  );
}
