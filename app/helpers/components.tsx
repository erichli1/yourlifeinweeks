import React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function WrapInTooltip({
  children,
  text,
  asChild,
  delayDuration = 50,
}: {
  children: React.ReactNode;
  text: string;
  asChild?: boolean;
  delayDuration?: number;
}) {
  return (
    <Tooltip delayDuration={delayDuration}>
      <TooltipTrigger asChild={asChild}>{children}</TooltipTrigger>
      <TooltipContent className="bg-background shadow-md text-primary border-input">
        <p>{text}</p>
      </TooltipContent>
    </Tooltip>
  );
}
