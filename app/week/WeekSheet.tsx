"use client";

import { Button } from "@/components/ui/button";
import { SignInButton } from "@clerk/clerk-react";
import { cn } from "@/lib/utils";
import React from "react";
import {
  getDatesFromWeekNumber,
  renderDate,
  YearWeek,
} from "../helpers/date-utils";
import { User } from "../helpers/utils";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { Separator } from "@/components/ui/separator";
import { Color } from "@/convex/utils";
import { getWeekBoxCustomColor } from "../helpers/colors";
import { ColorPicker } from "./shared/ColorPicker";
import { EditDisplayName } from "./shared/EditDisplayName";
import { DeleteMoment } from "./shared/DeleteMoment";
import { CreateImagesBlock, CreateJournalBlock } from "./shared/CreateBlock";
import { MomentComponent } from "./shared/MomentComponent";

type Moment = NonNullable<
  typeof api.myFunctions.getMomentForYearWeek._returnType
>;

function AuthenticatedWeekContentWithMoment({
  user,
  yearWeek,
  moment,
}: {
  user: User;
  yearWeek: YearWeek;
  moment: Moment;
}) {
  return (
    <WeekSheetContainer user={user} yearWeek={yearWeek} color={moment.color}>
      <div className="col-span-2 overflow-y-auto">
        <div className="grid grid-cols-[3rem_1fr] gap-y-3">
          <MomentComponent moment={moment} />
        </div>
      </div>

      <div />
      <div>
        <Separator className="my-2" />
        <div className="flex flex-row justify-between">
          <div className="flex flex-row gap-2">
            <CreateJournalBlock momentId={moment._id} />

            <CreateImagesBlock momentId={moment._id} />
          </div>

          <div className="flex flex-row gap-2">
            <EditDisplayName moment={moment} />

            <ColorPicker momentId={moment._id} selectedColor={moment.color} />

            <div>
              <DeleteMoment momentId={moment._id} />
            </div>
          </div>
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
  const moment = useQuery(api.myFunctions.getMomentForYearWeek, {
    year: yearWeek.year,
    week: yearWeek.week,
  });

  if (moment === undefined) return <></>;

  if (moment === null)
    return (
      <AuthenticatedWeekContentWithNoMoment user={user} yearWeek={yearWeek} />
    );

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
  color,
}: {
  user: User;
  yearWeek: YearWeek;
  children: React.ReactNode;
  color?: Color;
}) {
  const { start, end } = getDatesFromWeekNumber({
    birthday: user.birthday,
    yearWeek,
  });

  return (
    <>
      <div className={cn("h-1", color && getWeekBoxCustomColor(color))} />
      <div className="h-full py-4 pr-4">
        <div className="grid grid-cols-[3rem_1fr] pt-4 pr-4 grid-rows-[auto_1fr_auto] h-full">
          <div />
          <div>
            <div className="flex flex-row gap-1 justify-between items-center">
              <div className="flex flex-row gap-1 items-center">
                <div>
                  Year {yearWeek.year}, Week {yearWeek.week}
                </div>
              </div>
              <div>
                {renderDate(start, "MM/DD/YY")} - {renderDate(end, "MM/DD/YY")}
              </div>
            </div>
            <Separator className="my-2" />
          </div>

          {children}
        </div>
      </div>
    </>
  );
}

export function WeekSheetContent({
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
