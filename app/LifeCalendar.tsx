"use client";

import { Button } from "@/components/ui/button";
import { SignInButton } from "@clerk/clerk-react";
import { MinimizeIcon, TrashIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  didYearWeekPassRelativeToToday,
  getDatesFromWeekNumber,
  renderDate,
  YearWeek,
} from "./helpers/date-utils";
import { useZoom, useDrag, DEFAULT_ZOOM } from "./helpers/interactions";
import { WrapInTooltip } from "./helpers/components";
import { User } from "./helpers/utils";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
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

function Moment({
  moment,
}: {
  moment: (typeof api.myFunctions.getMomentsForYearWeek._returnType)[number];
}) {
  const [name, setName] = useState(moment.name);
  const deleteMoment = useMutation(api.myFunctions.deleteMoment);
  const renameMoment = useMutation(api.myFunctions.renameMoment);

  useEffect(() => {
    setName(moment.name);
  }, [moment.name]);

  const sendRequest = useCallback(
    (value: string) => {
      renameMoment({ momentId: moment._id, name: value }).catch(console.error);
    },
    [moment._id, renameMoment]
  );

  const debouncedSendRequest = useMemo(() => {
    return debounce(sendRequest, 500);
  }, [sendRequest]);

  return (
    <>
      <div className="flex flex-row gap-2 justify-between items-center">
        <Input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            debouncedSendRequest(e.target.value);
          }}
          className={cn(
            "w-full rounded-none font-bold border-0 shadow-none focus-visible:ring-0 px-0 py-0.5"
          )}
          placeholder="something big"
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            deleteMoment({ momentId: moment._id }).catch(console.error);
          }}
        >
          <TrashIcon className="w-4 h-4" />
        </Button>
      </div>
      <Separator />
    </>
  );
}

function AuthenticatedWeekContent({ yearWeek }: { yearWeek: YearWeek }) {
  const createMoment = useMutation(api.myFunctions.createMomentForYearWeek);
  const moments = useQuery(api.myFunctions.getMomentsForYearWeek, {
    year: yearWeek.year,
    week: yearWeek.week,
  });

  if (moments === undefined) return <></>;

  return (
    <>
      <Separator />
      {moments.map((m) => (
        <Moment moment={m} key={m._id} />
      ))}
      <div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            createMoment({
              name: "something big",
              year: yearWeek.year,
              week: yearWeek.week,
            }).catch(console.error);
          }}
        >
          Add moment
        </Button>
      </div>
    </>
  );
}

function UnauthenticatedWeekContent() {
  return (
    <div>
      <SignInButton
        mode="modal"
        redirectUrl={window ? window.location.href : undefined}
      >
        <span className="underline cursor-pointer">Sign in</span>
      </SignInButton>{" "}
      to add moments
    </div>
  );
}

function WeekContentContainer({
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
    <div className="flex flex-col gap-2 text-sm">
      <div className="flex flex-row gap-1 justify-between">
        <div>
          Year {yearWeek.year}, Week {yearWeek.week}
        </div>
        <div>
          {renderDate(start, "MM/DD/YY")} - {renderDate(end, "MM/DD/YY")}
        </div>
      </div>

      {user.signedIn ? (
        <AuthenticatedWeekContent yearWeek={yearWeek} />
      ) : (
        <UnauthenticatedWeekContent />
      )}
    </div>
  );
}

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
}: {
  isFilled: boolean;
  yearWeek: YearWeek;
  user: User;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  const modifyHoveringState = useCallback((value: boolean) => {
    setIsHovering(value);
  }, []);

  const debouncedSendRequest = useMemo(() => {
    return debounce(modifyHoveringState, 500);
  }, [modifyHoveringState]);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger>
        <Popover open={isHovering}>
          <PopoverTrigger asChild>
            <div
              className={cn(
                "aspect-square border-[2px] border-filled flex items-center justify-center rounded-lg text-4xl",
                "transition-colors transition-transform",
                isFilled ? "bg-filled" : "bg-empty",
                isFilled ? "hover:bg-hoverFilled" : "hover:bg-hoverEmpty",
                isOpen && (isFilled ? "bg-hoverFilled" : "bg-hoverEmpty")
              )}
              onMouseEnter={() => debouncedSendRequest(true)}
              onMouseLeave={() => debouncedSendRequest(false)}
            />
          </PopoverTrigger>
          <PopoverContent className="bg-background w-fit">
            <WeekBoxPopover user={user} yearWeek={yearWeek} />
          </PopoverContent>
        </Popover>
      </SheetTrigger>
      <SheetContent side="right">
        {/* Radix requires title to be set */}
        <SheetTitle />
        <div className="pt-4">
          <WeekContentContainer user={user} yearWeek={yearWeek} />
        </div>
      </SheetContent>
    </Sheet>
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
