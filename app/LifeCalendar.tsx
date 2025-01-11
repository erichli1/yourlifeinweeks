"use client";

import { Button } from "@/components/ui/button";
import { MinimizeIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  didYearWeekPassRelativeToToday,
  getCurrentYearWeekRelativeToBirthday,
  getDatesFromWeekNumber,
  renderDate,
  YearWeek,
} from "./helpers/date-utils";
import { useZoom, useDrag, DEFAULT_ZOOM } from "./helpers/interactions";
import { WrapInTooltip } from "./helpers/components";
import { User } from "./helpers/utils";
import { debounce } from "lodash";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { WeekSheetContent } from "./week/WeekSheet";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { FitText } from "./helpers/fit-text";
import { getWeekBoxCustomColor } from "./helpers/colors";
import { Color } from "@/convex/utils";
import { CmdK } from "./helpers/cmd-k";
import { useMediaQuery } from "react-responsive";
import { Badge } from "@/components/ui/badge";
import { MobileWeekContent } from "./week/MobileWeek";

function WeekBoxPopover({
  user,
  yearWeek,
}: {
  user: User;
  yearWeek: YearWeek;
}) {
  const { start, end } = getDatesFromWeekNumber({
    birthday: user.birthday,
    yearWeek,
  });

  return (
    <div className="text-xs">
      <span className="font-bold">
        Year {yearWeek.year}, Week {yearWeek.week}
      </span>{" "}
      ({renderDate(start, "MM/DD/YY")} - {renderDate(end, "MM/DD/YY")})
    </div>
  );
}

function WeekBox({
  isFilled,
  year,
  week,
  user,
  displayProps,
  setSelectedYearWeek,
}: {
  isFilled: boolean;
  year: number;
  week: number;
  user: User;
  displayProps?: DisplayProps;
  setSelectedYearWeek: (yearWeek: YearWeek) => void;
}) {
  const [isHovering, setIsHovering] = useState(false);

  const modifyHoveringState = useCallback((value: boolean) => {
    setIsHovering(value);
  }, []);

  const debouncedSendRequest = useMemo(() => {
    return debounce(modifyHoveringState, 250);
  }, [modifyHoveringState]);

  return (
    <Popover open={isHovering}>
      <PopoverTrigger asChild>
        <div
          className={cn(
            "aspect-square flex items-center justify-center rounded-lg cursor-pointer",
            "transition-colors transition-transform",
            isFilled ? "bg-filled" : "bg-empty border-filled border-[2px]",
            isFilled ? "hover:bg-hoverFilled" : "hover:bg-hoverEmpty",
            displayProps?.color
              ? getWeekBoxCustomColor(displayProps.color, true)
              : ""
          )}
          onMouseEnter={() => debouncedSendRequest(true)}
          onMouseLeave={() => debouncedSendRequest(false)}
          onClick={() => setSelectedYearWeek({ year, week })}
        >
          {displayProps?.displayName && (
            <FitText text={displayProps.displayName} className="" />
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="bg-background w-fit p-2 pointer-events-none"
        side="top"
      >
        <WeekBoxPopover user={user} yearWeek={{ year, week }} />
      </PopoverContent>
    </Popover>
  );
}

const MemoizedWeekBox = React.memo(WeekBox);

type DisplayProps = {
  displayName?: string;
  color?: Color;
  year: number;
  week: number;
};

function GridCalendar({ user }: { user: User }) {
  const [selectedYearWeek, setSelectedYearWeek] = useState<YearWeek | null>(
    null
  );

  const displayProps = useQuery(api.myFunctions.getDisplayProps);

  const displayPropsMap: Map<
    number,
    Map<number, DisplayProps>
  > = useMemo(() => {
    const map = new Map<number, Map<number, DisplayProps>>();

    if (displayProps)
      displayProps.forEach(({ year, week, displayName, color }) => {
        map.set(
          year,
          (map.get(year) || new Map()).set(week, {
            displayName,
            color,
          })
        );
      });

    return map;
  }, [displayProps]);

  if (!displayProps) return <></>;

  return (
    <div
      className="grid gap-[10px]"
      style={{
        gridTemplateRows: "repeat(90, minmax(0, 1fr))",
        gridTemplateColumns: "repeat(54, minmax(0, 1fr))",
      }}
    >
      {/* Empty box at 0,0 */}
      <div className="bg-background sticky top-0 left-0 z-20" />
      {/* Week numbers header row */}
      {Array.from({ length: 52 }).map((_, i) => (
        <div
          key={`header-week-${i}`}
          className="text-[40px] text-center flex items-center justify-center overflow-hidden bg-background sticky top-0 select-none"
        >
          {i + 1}
        </div>
      ))}
      <div />
      {/* Grid cells */}
      {Array.from({ length: 90 }).map((_, year) => (
        <React.Fragment key={`year-${year}`}>
          <div
            key={`header-year-${year}`}
            className="text-[40px] text-center flex items-center justify-center overflow-hidden bg-background sticky left-0 select-none"
          >
            {year}
          </div>
          {Array.from({ length: 52 }).map((_, week0Indexed) => (
            <MemoizedWeekBox
              isFilled={didYearWeekPassRelativeToToday({
                birthday: user.birthday,
                yearWeek: { year, week: week0Indexed + 1 },
              })}
              user={user}
              year={year}
              week={week0Indexed + 1}
              key={`cell-${year}-${week0Indexed + 1}`}
              displayProps={displayPropsMap.get(year)?.get(week0Indexed + 1)}
              setSelectedYearWeek={setSelectedYearWeek}
            />
          ))}
          <div />
        </React.Fragment>
      ))}

      <Sheet
        open={!!selectedYearWeek}
        onOpenChange={(open) => {
          if (!open) setSelectedYearWeek(null);
        }}
      >
        <SheetContent side="right" className="p-0 sm:max-w-full">
          {/* Radix requires title & description to be set */}
          <SheetTitle />
          <SheetDescription />
          {selectedYearWeek && (
            <WeekSheetContent user={user} yearWeek={selectedYearWeek} />
          )}
        </SheetContent>
      </Sheet>

      <CmdK birthday={user.birthday} setYearWeek={setSelectedYearWeek} />
    </div>
  );
}

const MemoizedGridCalendar = React.memo(GridCalendar);

export function LifeCalendar({ user }: { user: User }) {
  const pageRef = useRef<HTMLDivElement>(null);
  const { zoom, resetZoom } = useZoom(pageRef);
  useDrag(pageRef);

  const isMobile = useMediaQuery({ query: "(max-width: 640px)" });

  if (isMobile) return <MobileComponent user={user} />;

  return (
    <div
      className="h-screen overflow-auto flex cursor-grab active:cursor-grabbing"
      ref={pageRef}
    >
      <div
        className="mx-auto my-auto"
        style={{
          aspectRatio: "54/91",
          height: "min(950vh, 950vw * 91/54)",
          width: "min(950vw, 950vh * 54/91)",
          zoom: zoom * 0.1,
        }}
      >
        <MemoizedGridCalendar user={user} />
      </div>
      <div className="fixed bottom-0 left-0 m-2 flex flex-row gap-1">
        {zoom !== DEFAULT_ZOOM && (
          <WrapInTooltip text="Reset zoom" asChild>
            <Button
              className="bg-background shadow-lg"
              variant="outline"
              size="icon"
              onClick={resetZoom}
            >
              <MinimizeIcon className="w-4 h-4" />
            </Button>
          </WrapInTooltip>
        )}
      </div>
    </div>
  );
}

function MobileComponent({ user }: { user: User }) {
  const displayProps = useQuery(api.myFunctions.getDisplayProps);

  if (!displayProps) return <></>;

  const currentYearWeek = getCurrentYearWeekRelativeToBirthday(user.birthday);

  return (
    <div className="p-4 flex flex-col gap-4">
      <p className="font-bold">
        Welcome to year {currentYearWeek.year}, week {currentYearWeek.week}.
      </p>

      {user.signedIn && (
        <>
          {displayProps.map((displayProps, idx) => (
            <MobileWeekContainer
              user={user}
              displayProps={displayProps}
              key={`mobile-week-${idx}`}
            />
          ))}
        </>
      )}

      {!user.signedIn && (
        <div className="flex flex-row gap-2 items-start">
          <p>Sign in to add moments!</p>
        </div>
      )}
    </div>
  );
}

function MobileWeekContainer({
  user,
  displayProps,
}: {
  user: User;
  displayProps: DisplayProps;
}) {
  const { start, end } = getDatesFromWeekNumber({
    birthday: user.birthday,
    yearWeek: { year: displayProps.year, week: displayProps.week },
  });

  const badgeText = displayProps.displayName
    ? displayProps.displayName.length > 0
      ? displayProps.displayName
      : "Moment"
    : "Moment";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-row gap-2 items-start">
        <Badge
          className={cn(
            displayProps.color && getWeekBoxCustomColor(displayProps.color)
          )}
        >
          {badgeText}
        </Badge>

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

      <MobileWeekContent user={user} yearWeek={displayProps} />
    </div>
  );
}
