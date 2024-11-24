"use client";

import { Button } from "@/components/ui/button";
import { MinimizeIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  didYearWeekPassRelativeToToday,
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
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { WeekSheet } from "./WeekSheet";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { FitText } from "./helpers/fit-text";

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
  yearWeek,
  user,
  displayName,
}: {
  isFilled: boolean;
  yearWeek: YearWeek;
  user: User;
  displayName?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  const modifyHoveringState = useCallback((value: boolean) => {
    setIsHovering(value);
  }, []);

  const debouncedSendRequest = useMemo(() => {
    return debounce(modifyHoveringState, 250);
  }, [modifyHoveringState]);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger>
        <Popover open={isHovering}>
          <PopoverTrigger asChild>
            <div
              className={cn(
                "aspect-square border-[2px] border-filled flex items-center justify-center rounded-lg",
                "transition-colors transition-transform",
                isFilled ? "bg-filled" : "bg-empty",
                isFilled ? "hover:bg-hoverFilled" : "hover:bg-hoverEmpty",
                isOpen && (isFilled ? "bg-hoverFilled" : "bg-hoverEmpty")
              )}
              onMouseEnter={() => debouncedSendRequest(true)}
              onMouseLeave={() => debouncedSendRequest(false)}
            >
              {displayName && (
                <FitText text={displayName} className="font-bold" />
              )}
            </div>
          </PopoverTrigger>
          <PopoverContent className="bg-background w-fit p-2" side="top">
            <WeekBoxPopover user={user} yearWeek={yearWeek} />
          </PopoverContent>
        </Popover>
      </SheetTrigger>
      <SheetContent side="right" className="pl-0 sm:max-w-full">
        {/* Radix requires title to be set */}
        <SheetTitle />
        <WeekSheet user={user} yearWeek={yearWeek} />
      </SheetContent>
    </Sheet>
  );
}

const MemoizedWeekBox = React.memo(WeekBox);

function GridCalendar({ user }: { user: User }) {
  const displayNames = useQuery(api.myFunctions.getDisplayNames);

  const displayNamesMap: Map<number, Map<number, string>> = useMemo(() => {
    const map = new Map<number, Map<number, string>>();

    if (displayNames)
      displayNames.forEach(({ year, week, displayName }) => {
        map.set(year, (map.get(year) || new Map()).set(week, displayName));
      });

    return map;
  }, [displayNames]);

  if (!displayNames) return <></>;

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
          className="text-[40px] text-center flex items-center justify-center overflow-hidden bg-background sticky top-0"
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
            className="text-[40px] text-center flex items-center justify-center overflow-hidden bg-background sticky left-0"
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
              yearWeek={{ year, week: week0Indexed + 1 }}
              key={`cell-${year}-${week0Indexed + 1}`}
              displayName={displayNamesMap.get(year)?.get(week0Indexed + 1)}
            />
          ))}
          <div />
        </React.Fragment>
      ))}
    </div>
  );
}

const MemoizedGridCalendar = React.memo(GridCalendar);

export function LifeCalendar({ user }: { user: User }) {
  const pageRef = useRef<HTMLDivElement>(null);
  const { zoom, resetZoom } = useZoom(pageRef);
  useDrag(pageRef);

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
