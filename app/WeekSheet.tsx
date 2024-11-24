"use client";

import { Button } from "@/components/ui/button";
import { SignInButton } from "@clerk/clerk-react";
import { ImageIcon, NotebookPenIcon, TrashIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  getDatesFromWeekNumber,
  renderDate,
  YearWeek,
} from "./helpers/date-utils";
import { WrapInTooltip } from "./helpers/components";
import { User } from "./helpers/utils";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { debounce } from "lodash";
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

          <WrapInTooltip text="Delete entry" delayDuration={0} asChild>
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
          placeholder="what's on your mind?"
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

function AuthenticatedWeekContentWithMoment({
  user,
  yearWeek,
  moment,
}: {
  user: User;
  yearWeek: YearWeek;
  moment: (typeof api.myFunctions.getMomentsForYearWeek._returnType)[number];
}) {
  const createJournalEntry = useMutation(api.myFunctions.createJournalEntry);
  const deleteMoment = useMutation(api.myFunctions.deleteMoment);
  return (
    <WeekSheetContainer user={user} yearWeek={yearWeek}>
      <div className="col-span-2 overflow-y-auto">
        <div className="grid grid-cols-[3rem_1fr]">
          <Moment moment={moment} />
        </div>
      </div>

      <div />
      <div>
        <Separator className="my-2" />
        <div className="flex flex-row justify-between">
          <div className="flex flex-row gap-2">
            <WrapInTooltip text="Add journal entry" delayDuration={0} asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  createJournalEntry({ momentId: moment._id }).catch(
                    console.error
                  );
                }}
              >
                <NotebookPenIcon className="w-4 h-4 mr-1" />
                Journal
              </Button>
            </WrapInTooltip>

            <WrapInTooltip text="Add image" delayDuration={0} asChild>
              <Button variant="outline" size="sm" disabled>
                <ImageIcon className="w-4 h-4 mr-1" />
                Image
              </Button>
            </WrapInTooltip>
          </div>

          <WrapInTooltip text="Delete moment" delayDuration={0} asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                deleteMoment({ momentId: moment._id }).catch(console.error);
              }}
            >
              <TrashIcon className="w-4 h-4" />
            </Button>
          </WrapInTooltip>
        </div>
      </div>
    </WeekSheetContainer>
  );
}

function AuthenticatedWeekContentWithNoMoment({
  user,
  yearWeek,
}: {
  user: User;
  yearWeek: YearWeek;
}) {
  const createMoment = useMutation(api.myFunctions.createMomentForYearWeek);

  return (
    <WeekSheetContainer user={user} yearWeek={yearWeek}>
      <div />
      <div className="h-full flex items-center justify-center">
        <Button
          variant="outline"
          onClick={() => {
            createMoment({
              year: yearWeek.year,
              week: yearWeek.week,
              name: "",
            }).catch(console.error);
          }}
        >
          add a moment
        </Button>
      </div>
    </WeekSheetContainer>
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

  if (moments === undefined) return <></>;

  if (moments.length === 0)
    return (
      <AuthenticatedWeekContentWithNoMoment user={user} yearWeek={yearWeek} />
    );

  const moment = moments[0];

  return (
    <AuthenticatedWeekContentWithMoment
      user={user}
      yearWeek={yearWeek}
      moment={moment}
    />
  );
}

function UnauthenticatedWeekContent({
  user,
  yearWeek,
}: {
  user: User;
  yearWeek: YearWeek;
}) {
  return (
    <WeekSheetContainer user={user} yearWeek={yearWeek}>
      <div />
      <div className="h-full flex items-center justify-center">
        <p>
          <SignInButton
            mode="modal"
            redirectUrl={window ? window.location.href : undefined}
          >
            <span className="underline cursor-pointer">Sign in</span>
          </SignInButton>{" "}
          to add moments
        </p>
      </div>
    </WeekSheetContainer>
  );
}

function WeekSheetContainer({
  user,
  yearWeek,
  children,
}: {
  user: User;
  yearWeek: YearWeek;
  children: React.ReactNode;
}) {
  const { start, end } = getDatesFromWeekNumber({
    birthday: user.birthday,
    yearWeek,
  });

  return (
    <div className="grid grid-cols-[3rem_1fr] pt-4 pr-4 grid-rows-[auto_1fr_auto] h-full">
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

      {children}
    </div>
  );
}

export function WeekSheet({
  user,
  yearWeek,
}: {
  user: User;
  yearWeek: YearWeek;
}) {
  return user.signedIn ? (
    <AuthenticatedWeekContent user={user} yearWeek={yearWeek} />
  ) : (
    <UnauthenticatedWeekContent user={user} yearWeek={yearWeek} />
  );
}
