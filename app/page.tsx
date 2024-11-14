"use client";

import { Button } from "@/components/ui/button";
import {
  Authenticated,
  Unauthenticated,
  useMutation,
  useQuery,
} from "convex/react";
import { api } from "@/convex/_generated/api";
import { Code } from "@/components/typography/code";
import { Link } from "@/components/typography/link";
import { SignInButton, useUser } from "@clerk/clerk-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { ChevronRight, LogInIcon, MinimizeIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import React, { useEffect, useRef, useState } from "react";
import { Onboarding } from "./Onboarding";
import {
  didYearWeekPassRelativeToToday,
  getDatesFromWeekNumber,
  renderDate,
  YearWeek,
} from "./helpers/utils";
import { useZoom, useDrag, DEFAULT_ZOOM } from "./helpers/interactions";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const MIN_BIRTHDAY_DATE = new Date("1930-01-01");

const isValidDate = (dateStr: string) => {
  const parsedDate = Date.parse(dateStr);

  return (
    parsedDate >= MIN_BIRTHDAY_DATE.getTime() &&
    parsedDate <= new Date().getTime()
  );
};

export default function Home() {
  return (
    <>
      <main className="flex flex-col">
        <Authenticated>
          <SignedInContent />
        </Authenticated>
        <Unauthenticated>
          <UnauthenticatedScreen />
        </Unauthenticated>
      </main>
    </>
  );
}

function UnauthenticatedScreen() {
  const [loading, setLoading] = useState(true);
  const [birthday, setBirthday] = useState<Date | undefined>(undefined);
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const birthdayParam = params.get("birthday");
    if (birthdayParam && isValidDate(birthdayParam))
      setBirthday(new Date(birthdayParam + "T00:00:00"));

    const onboardingParam = params.get("onboarding");
    if (onboardingParam === "false") setOnboardingComplete(true);

    setLoading(false);
  }, []);

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center">
        Loading...
      </div>
    );

  return birthday ? (
    onboardingComplete ? (
      <LifeCalendar birthday={birthday} />
    ) : (
      <Onboarding
        birthday={birthday}
        setOnboardingComplete={setOnboardingComplete}
      />
    )
  ) : (
    <InitialState />
  );
}

// TODO: make date picker cuter (https://github.com/dubinc/dub/blob/7abb88671d68d107004678b47fecd7f7ba40d918/apps/web/ui/modals/add-edit-link-modal/expiration-section.tsx)
function InitialState() {
  const [date, setDate] = useState<string>("2000-12-11");

  const updateSearchParams = () => {
    window.location.search = `?birthday=${date}`;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && isValidDate(date)) updateSearchParams();
  };

  return (
    <div className="flex items-center justify-center h-screen p-4">
      <div className="flex flex-col gap-2 max-w-md">
        <div>Your life map awaits — just enter your birthday.</div>
        <div className="flex flex-row gap-2">
          <Input
            type="date"
            placeholder="Date"
            className="w-fit cursor-text"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          {isValidDate(date) ? (
            <Button size="icon" onClick={updateSearchParams} variant="outline">
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : null}
        </div>
        <div className="text-sm text-gray-500 pt-2">
          Been here before?{" "}
          <SignInButton mode="modal">
            <span className="underline cursor-pointer">Sign in</span>
          </SignInButton>
          .
        </div>
      </div>
    </div>
  );
}

function WeekBox({
  isFilled,
  yearWeek,
  signedIn,
  birthday,
}: {
  isFilled: boolean;
  yearWeek: YearWeek;
  signedIn: boolean;
  birthday: Date;
}) {
  const { start, end } = getDatesFromWeekNumber({
    birthday,
    yearWeek,
  });

  return (
    <Popover>
      <PopoverTrigger>
        <div
          className={cn(
            "aspect-square border-[2px] border-black dark:border-white flex items-center justify-center",
            isFilled ? "bg-black dark:bg-white" : ""
          )}
        />
      </PopoverTrigger>
      <PopoverContent side="right" className="w-64 md:w-96 shadow-lg">
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex flex-row gap-1 justify-between">
            <div>
              Year {yearWeek.year}, Week {yearWeek.week}
            </div>
            <div>
              {renderDate(start, "MM/DD/YY")} - {renderDate(end, "MM/DD/YY")}
            </div>
          </div>
          {!signedIn && (
            <div>
              <SignInButton mode="modal">
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

function GridCalendar({
  birthday,
  signedIn,
}: {
  birthday: Date;
  signedIn: boolean;
}) {
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
          {Array.from({ length: 52 }).map((_, week) => (
            <MemoizedWeekBox
              isFilled={didYearWeekPassRelativeToToday({
                birthday,
                yearWeek: { year, week },
              })}
              signedIn={signedIn}
              yearWeek={{ year, week }}
              birthday={birthday}
              key={`cell-${year}-${week}`}
            />
          ))}
          <div />
        </React.Fragment>
      ))}
    </div>
  );
}

const MemoizedGridCalendar = React.memo(GridCalendar);

function LifeCalendar({ birthday }: { birthday: Date }) {
  const pageRef = useRef<HTMLDivElement>(null);
  const { zoom, resetZoom } = useZoom(pageRef);
  useDrag(pageRef);

  const { user } = useUser();

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
        <MemoizedGridCalendar birthday={birthday} signedIn={!!user} />
      </div>
      <div className="fixed bottom-0 right-0 m-2 flex flex-row gap-1">
        {zoom !== DEFAULT_ZOOM && (
          <Button
            className="bg-background shadow-lg"
            variant="outline"
            size="icon"
            onClick={resetZoom}
          >
            <MinimizeIcon className="w-4 h-4" />
          </Button>
        )}

        <SignInButton mode="modal">
          <Button
            className="bg-background shadow-lg"
            variant="outline"
            size="icon"
          >
            <LogInIcon className="w-4 h-4" />
          </Button>
        </SignInButton>
      </div>
    </div>
  );
}

function SignedInContent() {
  const { viewer, numbers } =
    useQuery(api.myFunctions.listNumbers, {
      count: 10,
    }) ?? {};
  const addNumber = useMutation(api.myFunctions.addNumber);

  if (viewer === undefined || numbers === undefined) {
    return (
      <>
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-full" />
      </>
    );
  }

  return (
    <>
      <p>Welcome {viewer ?? "N/A"}!</p>
      <p>
        Click the button below and open this page in another window - this data
        is persisted in the Convex cloud database!
      </p>
      <p>
        <Button
          onClick={() => {
            void addNumber({ value: Math.floor(Math.random() * 10) });
          }}
        >
          Add a random number
        </Button>
      </p>
      <p>
        Numbers:{" "}
        {numbers?.length === 0
          ? "Click the button!"
          : numbers?.join(", ") ?? "..."}
      </p>
      <p>
        Edit <Code>convex/myFunctions.ts</Code> to change your backend
      </p>
      <p>
        Edit <Code>app/page.tsx</Code> to change your frontend
      </p>
      <p>
        Check out{" "}
        <Link target="_blank" href="https://docs.convex.dev/home">
          Convex docs
        </Link>
      </p>
      <p>
        To build a full page layout copy one of the included{" "}
        <Link target="_blank" href="/layouts">
          layouts
        </Link>
      </p>
    </>
  );
}
