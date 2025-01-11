"use client";

import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { YearWeek } from "../helpers/date-utils";
import { User } from "../helpers/utils";
import { MomentComponent } from "./shared/MomentComponent";

export function MobileWeekContent({
  user,
  yearWeek,
}: {
  user: User;
  yearWeek: YearWeek;
}) {
  return user.signedIn ? (
    <AuthenticatedMobileWeekContent user={user} yearWeek={yearWeek} />
  ) : (
    <></>
  );
}

function AuthenticatedMobileWeekContent({
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

  if (!moment) return <></>;

  return <MomentComponent moment={moment} />;
}
