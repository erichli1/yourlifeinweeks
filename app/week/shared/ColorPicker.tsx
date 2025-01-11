import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import React from "react";
import { WrapInTooltip } from "../../helpers/components";
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import { Color, COLORS } from "@/convex/utils";
import { Id } from "@/convex/_generated/dataModel";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { getWeekBoxCustomColor } from "../../helpers/colors";

const COLOR_CIRCLE_CLASSES = "w-4 h-4 rounded-full";

export function ColorPicker({
  selectedColor,
  momentId,
}: {
  selectedColor?: Color;
  momentId: Id<"moments">;
}) {
  const updateColor = useMutation(api.myFunctions.updateColor);

  return (
    <Popover modal>
      <WrapInTooltip text="Change color" delayDuration={0} asChild>
        <PopoverTrigger asChild>
          <Button variant="outline" size="icon" className="h-8 w-8">
            <div
              className={cn(
                COLOR_CIRCLE_CLASSES,
                selectedColor
                  ? getWeekBoxCustomColor(selectedColor)
                  : "border-2 border-filled"
              )}
            />
          </Button>
        </PopoverTrigger>
      </WrapInTooltip>
      <PopoverContent className="bg-background w-fit max-w-xs mx-1 p-2">
        <div className="flex flex-row flex-wrap gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => {
              updateColor({ momentId, color: undefined }).catch(console.error);
            }}
          >
            <div
              className={cn(COLOR_CIRCLE_CLASSES, "border-2 border-filled")}
            />
          </Button>

          {COLORS.map((color) => (
            <Button
              variant="outline"
              key={`color-picker-option-${color}`}
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                updateColor({ momentId, color }).catch(console.error);
              }}
            >
              <div
                className={cn(
                  COLOR_CIRCLE_CLASSES,
                  getWeekBoxCustomColor(color)
                )}
              />
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
