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
// import { SignInButton } from "@clerk/clerk-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import React from "react";

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
  const [birthday, setBirthday] = useState<Date | undefined>(undefined);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const birthdayParam = params.get("birthday");
    if (birthdayParam && isValidDate(birthdayParam)) {
      setBirthday(new Date(birthdayParam));
    }
  }, []);

  return birthday ? <LifeCalendar birthday={birthday} /> : <InitialState />;
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
        <div>
          Welcome to your life in weeks — a reminder that life is short.
          When&apos;s your birthday?
        </div>
        <div className="flex flex-row gap-2">
          <Input
            type="date"
            placeholder="Date"
            className="w-fit"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          {isValidDate(date) ? (
            <Button size="icon" onClick={updateSearchParams}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : null}
        </div>
        {/* <div className="text-sm text-gray-500 pt-2">
          Been here before?{" "}
          <SignInButton mode="modal">
            <span className="underline">Sign in</span>
          </SignInButton>
          .
        </div> */}
      </div>
    </div>
  );
}

function LifeCalendar({ birthday }: { birthday: Date }) {
  const today = new Date();

  const didWeekPass = (year: number, week: number) => {
    const date = new Date(birthday.getTime());
    date.setFullYear(birthday.getFullYear() + year);
    date.setDate(birthday.getDate() + week * 7);

    return date < today;
  };

  return (
    <div className="h-screen flex justify-center items-center p-4">
      <div
        className="grid gap-[1px]"
        style={{
          gridTemplateRows: "repeat(90, minmax(0, 1fr))",
          gridTemplateColumns: "repeat(52, minmax(0, 1fr))",
          aspectRatio: "52/90",
          height: "min(95vh, 95vw * 90/52)",
          width: "min(95vw, 95vh * 52/90)",
        }}
      >
        {/* Week numbers header row */}
        {/* <div></div>
        {Array.from({ length: 52 }).map((_, i) => (
          <div
            key={`header-week-${i}`}
            className="text-[8px] text-center text-gray-500 self-end overflow-hidden"
          >
            {i + 1}
          </div>
        ))} */}
        {/* Grid cells */}
        {Array.from({ length: 90 }).map((_, year) => (
          <React.Fragment key={`year-${year}`}>
            {/* <div
              key={`header-year-${year}`}
              className="text-[8px] text-center text-gray-500 overflow-hidden"
            >
              {year}
            </div> */}
            {Array.from({ length: 52 }).map((_, week) => (
              <div
                key={`cell-${year}-${week}`}
                className={cn(
                  "aspect-square border-[0.5px] border-black dark:border-white",
                  didWeekPass(year, week) ? "bg-black dark:bg-white" : ""
                )}
              />
            ))}
          </React.Fragment>
        ))}
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
