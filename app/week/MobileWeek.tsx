"use client";

import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { getDatesFromWeekNumber, renderDate } from "../helpers/date-utils";
import { User } from "../helpers/utils";
import { MomentComponent } from "./shared/MomentComponent";
import { cn } from "@/lib/utils";
import { getWeekBoxCustomColor } from "../helpers/colors";
import { Color } from "@/convex/utils";
import { Badge } from "@/components/ui/badge";
import { CreateImagesBlock, CreateJournalBlock } from "./shared/CreateBlock";
import { DeleteMoment } from "./shared/DeleteMoment";
import { EditDisplayName } from "./shared/EditDisplayName";
import { ColorPicker } from "./shared/ColorPicker";
import { Separator } from "@/components/ui/separator";
type DisplayProps = {
  displayName?: string;
  color?: Color;
  year: number;
  week: number;
};

export function MobileWeekContainer({
  user,
  displayProps,
}: {
  user: User;
  displayProps: DisplayProps;
}) {
  const moment = useQuery(api.myFunctions.getMomentForYearWeek, {
    year: displayProps.year,
    week: displayProps.week,
  });

  if (!moment) return <></>;

  const { start, end } = getDatesFromWeekNumber({
    birthday: user.birthday,
    yearWeek: { year: displayProps.year, week: displayProps.week },
  });

  const badgeText = displayProps.displayName
    ? displayProps.displayName.length > 0
      ? displayProps.displayName
      : "-"
    : "-";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-row gap-2 items-center">
        <ColorPicker
          momentId={moment._id}
          selectedColor={displayProps.color}
          customTrigger={
            <Badge
              className={cn(
                displayProps.color &&
                  getWeekBoxCustomColor(displayProps.color, true)
              )}
            >
              {badgeText}
            </Badge>
          }
        />

        <div className="flex flex-row gap-2">
          <p className="text-sm">
            Year {displayProps.year}, Week {displayProps.week}
          </p>

          <p className="text-sm">
            (
            {renderDate(
              start,
              start.getFullYear() === end.getFullYear() ? "MM/DD" : "MM/DD/YY"
            )}{" "}
            - {renderDate(end, "MM/DD/YY")})
          </p>
        </div>
      </div>

      <div
        className={cn(
          "h-1",
          displayProps.color && getWeekBoxCustomColor(displayProps.color)
        )}
      />

      <MomentComponent moment={moment} isMobile={true} />

      <Separator />

      <div className="flex flex-row gap-1">
        <DeleteMoment momentId={moment._id} />
        <CreateJournalBlock momentId={moment._id} />
        <CreateImagesBlock momentId={moment._id} />
        <EditDisplayName moment={moment} />
      </div>
    </div>
  );
}
