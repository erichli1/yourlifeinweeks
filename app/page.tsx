"use client";

import { Button } from "@/components/ui/button";
import {
  Authenticated,
  Unauthenticated,
  useQuery,
  useMutation,
} from "convex/react";
import { api } from "@/convex/_generated/api";
import { SignInButton, SignOutButton, useUser } from "@clerk/clerk-react";
import { Input } from "@/components/ui/input";
import {
  ChevronRight,
  LogInIcon,
  LogOutIcon,
  MinimizeIcon,
} from "lucide-react";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";

const MIN_BIRTHDAY_DATE = new Date("1930-01-01");

const isValidDate = (dateStr: string) => {
  const parsedDate = Date.parse(dateStr);

  return (
    parsedDate >= MIN_BIRTHDAY_DATE.getTime() &&
    parsedDate <= new Date().getTime()
  );
};

function WrapInTooltip({
  children,
  text,
}: {
  children: React.ReactNode;
  text: string;
}) {
  return (
    <Tooltip delayDuration={50}>
      <TooltipTrigger>{children}</TooltipTrigger>
      <TooltipContent className="bg-background shadow-md text-primary border-input">
        <p>{text}</p>
      </TooltipContent>
    </Tooltip>
  );
}

function Navbar({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return <div>{children}</div>;

  return (
    <div>
      {children}
      <div className="fixed bottom-0 right-0 m-2 flex flex-row gap-1">
        {user ? (
          <WrapInTooltip text="Sign out">
            <SignOutButton>
              <Button
                className="bg-background shadow-lg"
                variant="outline"
                size="icon"
              >
                <LogOutIcon className="h-4 w-4" />
              </Button>
            </SignOutButton>
          </WrapInTooltip>
        ) : (
          <WrapInTooltip text="Sign in">
            <SignInButton mode="modal" redirectUrl={window.location.href}>
              <Button
                className="bg-background shadow-lg"
                variant="outline"
                size="icon"
                asChild
              >
                <LogInIcon className="w-4 h-4" />
              </Button>
            </SignInButton>
          </WrapInTooltip>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <>
      <main className="flex flex-col">
        <TooltipProvider>
          <Navbar>
            <Authenticated>
              <SignedInContent />
            </Authenticated>
            <Unauthenticated>
              <UnauthenticatedScreen />
            </Unauthenticated>
          </Navbar>
        </TooltipProvider>
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

  if (loading) return <LoadingScreen />;

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

function DatePicker({
  date,
  setDate,
  onEnter,
}: {
  date: string;
  setDate: (date: string) => void;
  onEnter?: () => void;
}) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onEnter && e.key === "Enter" && isValidDate(date)) onEnter();
  };

  return (
    <Input
      type="date"
      placeholder="Date"
      className="w-fit cursor-text"
      value={date}
      onChange={(e) => setDate(e.target.value)}
      onKeyDown={handleKeyDown}
    />
  );
}

function InitialState() {
  const [date, setDate] = useState<string>("2000-12-11");

  const updateSearchParams = () => {
    window.location.search = `?birthday=${date}`;
  };

  return (
    <div className="flex items-center justify-center h-screen p-4">
      <div className="flex flex-col gap-2 max-w-md">
        <div>Your life map awaits — just enter your birthday.</div>
        <div className="flex flex-row gap-2">
          <DatePicker
            date={date}
            setDate={setDate}
            onEnter={updateSearchParams}
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
            isOpen && (isFilled ? "bg-filled" : "bg-empty")
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
          {!signedIn && (
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
          {Array.from({ length: 52 }).map((_, week0Indexed) => (
            <MemoizedWeekBox
              isFilled={didYearWeekPassRelativeToToday({
                birthday,
                yearWeek: { year, week: week0Indexed + 1 },
              })}
              signedIn={signedIn}
              yearWeek={{ year, week: week0Indexed + 1 }}
              birthday={birthday}
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

function CreateUserFlow() {
  const [birthday, setBirthday] = useState<string>("");
  const [name, setName] = useState<string>("");

  const createUser = useMutation(api.myFunctions.createUser);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const birthdayParam = params.get("birthday");
    if (birthdayParam && isValidDate(birthdayParam)) setBirthday(birthdayParam);
  }, []);

  const canSubmit = isValidDate(birthday) && name.length > 0;

  const handleSubmit = () => {
    createUser({
      name,
      birthday: new Date(birthday + "T00:00:00").getTime(),
    }).catch(console.error);
  };

  return (
    <div className="flex flex-col gap-4 items-center justify-center h-screen p-4">
      <div className="grid w-full max-w-sm gap-1.5">
        <Label htmlFor="name">What&apos;s your name?</Label>
        <Input
          type="text"
          id="name"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="grid w-full max-w-sm items-center gap-1.5">
        <Label htmlFor="birthday">What&apos;s your birthday?</Label>
        <DatePicker date={birthday} setDate={setBirthday} />
      </div>

      {canSubmit ? (
        <div className="w-full max-w-sm">
          <Button onClick={handleSubmit}>All done</Button>
        </div>
      ) : null}
    </div>
  );
}

function SignedInContent() {
  const user = useQuery(api.myFunctions.getUser);

  // Remove URL params if user is found
  useEffect(() => {
    if (user) {
      const url = new URL(window.location.href);
      url.search = "";
      window.history.replaceState({}, "", url);
    }
  }, [user]);

  if (user === undefined) return <LoadingScreen />;
  if (user === null) return <CreateUserFlow />;

  return <LifeCalendar birthday={new Date(user.birthday)} />;
}

function LoadingScreen() {
  return (
    <div className="h-screen flex items-center justify-center">Loading...</div>
  );
}
