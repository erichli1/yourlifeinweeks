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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

function JournalEntry({
  journalEntry,
}: {
  journalEntry: (typeof api.myFunctions.getMomentsForYearWeek._returnType)[number]["journalEntries"][number];
}) {
  const [entry, setEntry] = useState(journalEntry.entry);
  const updateJournalEntry = useMutation(api.myFunctions.updateJournalEntry);
  const deleteJournalEntry = useMutation(api.myFunctions.deleteJournalEntry);

  useEffect(() => {
    setEntry(journalEntry.entry);
  }, [journalEntry.entry]);

  const updateJournalEntryCallback = useCallback(
    (value: string) => {
      updateJournalEntry({
        journalEntryId: journalEntry._id,
        entry: value,
      }).catch(console.error);
    },
    [journalEntry._id, updateJournalEntry]
  );

  const debouncedUpdateJournalEntry = useMemo(() => {
    return debounce(updateJournalEntryCallback, 1000);
  }, [updateJournalEntryCallback]);

  const [isHovering, setIsHovering] = useState(false);

  return (
    <div
      className="contents"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {isHovering ? (
        <div className="flex items-start justify-end pr-2">
          {/* <WrapInTooltip text="Add entry" delayDuration={0}>
            <Button
              variant="ghost"
              onClick={() => {
                createJournalEntry({ momentId }).catch(console.error);
              }}
              className="w-auto p-0"
            >
              <PlusIcon className="w-4 h-4" />
            </Button>
          </WrapInTooltip> */}

          <WrapInTooltip text="Delete entry" delayDuration={0}>
            <Button
              variant="ghost"
              onClick={() => {
                deleteJournalEntry({ journalEntryId: journalEntry._id }).catch(
                  console.error
                );
              }}
              className="w-auto p-0"
            >
              <TrashIcon className="w-4 h-4" />
            </Button>
          </WrapInTooltip>
        </div>
      ) : (
        <div />
      )}
      <div className="flex flex-col gap-1 pt-1">
        <div>
          <Badge variant="outline">
            {renderDate(new Date(journalEntry._creationTime), "MM/DD/YY HH:MM")}
          </Badge>
        </div>
        <Textarea
          className="resize-none border-0 shadow-none focus-visible:ring-0 pl-0"
          rows={1}
          autoSize
          placeholder="write something..."
          value={entry}
          onChange={(e) => {
            setEntry(e.target.value);
            debouncedUpdateJournalEntry(e.target.value);
          }}
        />
      </div>
    </div>
  );
}

function Moment({
  moment,
}: {
  moment: (typeof api.myFunctions.getMomentsForYearWeek._returnType)[number];
}) {
  const [name, setName] = useState(moment.name);
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
      <div className="contents">
        <div />

        <Input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            debouncedSendRequest(e.target.value);
          }}
          className={cn(
            "w-full rounded-none font-bold border-0 shadow-none focus-visible:ring-0 px-0 py-0.5",
            "h-16 text-4xl"
          )}
          placeholder="something big"
        />
      </div>

      {moment.journalEntries.map((entry) => (
        <JournalEntry journalEntry={entry} key={entry._id} />
      ))}
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

function AuthenticatedWeekContent({
  user,
  yearWeek,
}: {
  user: User;
  yearWeek: YearWeek;
}) {
  const moments = useQuery(api.myFunctions.getMomentsForYearWeek, {
    year: yearWeek.year,
    week: yearWeek.week,
  });
  const createJournalEntry = useMutation(api.myFunctions.createJournalEntry);

  if (moments === undefined || moments.length === 0) return <></>;

  const moment = moments[0];

  const { start, end } = getDatesFromWeekNumber({
    birthday: user.birthday,
    yearWeek,
  });

  return (
    <div className="grid grid-cols-[4rem_1fr] pt-4 pr-4 grid-rows-[auto_1fr_auto] h-full">
      <div />
      <div>
        <div className="flex flex-row gap-1 justify-between">
          <div>
            Year {yearWeek.year}, Week {yearWeek.week}
          </div>
          <div>
            {renderDate(start, "MM/DD/YY")} - {renderDate(end, "MM/DD/YY")}
          </div>
        </div>
        <Separator className="my-2" />
      </div>

      <div className="col-span-2 overflow-y-auto">
        <div className="grid grid-cols-[4rem_1fr]">
          <Moment moment={moment} />
        </div>
      </div>

      <div />
      <div>
        <Separator className="my-2" />
        <div className="flex flex-row justify-between">
          <div className="flex flex-row gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                createJournalEntry({ momentId: moment._id }).catch(
                  console.error
                );
              }}
            >
              Journal
            </Button>
            <Button variant="outline" size="sm" disabled>
              Image
            </Button>
          </div>

          <Button variant="outline" size="sm" disabled>
            Menu
          </Button>
        </div>
      </div>
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
  return user.signedIn ? (
    <AuthenticatedWeekContent user={user} yearWeek={yearWeek} />
  ) : (
    <UnauthenticatedWeekContent />
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
    return debounce(modifyHoveringState, 250);
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
          <PopoverContent className="bg-background w-fit p-2" side="top">
            <WeekBoxPopover user={user} yearWeek={yearWeek} />
          </PopoverContent>
        </Popover>
      </SheetTrigger>
      <SheetContent side="right" className="pl-0 sm:max-w-full">
        {/* Radix requires title to be set */}
        <SheetTitle />
        <WeekContentContainer user={user} yearWeek={yearWeek} />
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
