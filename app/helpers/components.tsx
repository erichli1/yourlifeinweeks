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
}: {
  children: React.ReactNode;
  text: string;
  asChild?: boolean;
}) {
  return (
    <Tooltip delayDuration={50}>
      <TooltipTrigger asChild={asChild}>{children}</TooltipTrigger>
      <TooltipContent className="bg-background shadow-md text-primary border-input">
        <p>{text}</p>
      </TooltipContent>
    </Tooltip>
  );
}
