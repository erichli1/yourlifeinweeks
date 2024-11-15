"use client";

import { Button } from "@/components/ui/button";
import { SignInButton } from "@clerk/clerk-react";
import { MinimizeIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import React, { useRef, useState } from "react";
import {
  didYearWeekPassRelativeToToday,
  getDatesFromWeekNumber,
  renderDate,
  YearWeek,
} from "./helpers/date-utils";
import { useZoom, useDrag, DEFAULT_ZOOM } from "./helpers/interactions";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { WrapInTooltip } from "./helpers/components";
import { User } from "./helpers/utils";

function WeekBox({
  isFilled,
  yearWeek,
  user,
}: {
  isFilled: boolean;
  yearWeek: YearWeek;
  user: User;
}) {
  const { start, end } = getDatesFromWeekNumber({
    birthday: user.birthday,
    yearWeek,
  });

  const [isOpen, setIsOpen] = useState(false);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger>
        <div
          className={cn(
            "aspect-square border-[2px] border-filled flex items-center justify-center rounded-lg",
            "transition-colors transition-transform",
            isFilled ? "bg-filled" : "bg-empty",
            isFilled ? "hover:bg-hoverFilled" : "hover:bg-hoverEmpty",
            isOpen && (isFilled ? "bg-hoverFilled" : "bg-hoverEmpty")
          )}
        />
      </PopoverTrigger>
      <PopoverContent
        side="right"
        className="w-64 md:w-96 shadow-lg bg-background"
      >
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex flex-row gap-1 justify-between">
            <div>
              Year {yearWeek.year}, Week {yearWeek.week}
            </div>
            <div>
              {renderDate(start, "MM/DD/YY")} - {renderDate(end, "MM/DD/YY")}
            </div>
          </div>
          {!user.signedIn && (
            <div>
              <SignInButton
                mode="modal"
                redirectUrl={window ? window.location.href : undefined}
              >
                <span className="underline cursor-pointer">Sign in</span>
              </SignInButton>{" "}
              to add moments
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

const MemoizedWeekBox = React.memo(WeekBox);

function GridCalendar({ user }: { user: User }) {
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
          <WrapInTooltip text="Reset zoom">
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
