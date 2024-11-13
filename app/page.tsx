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
import { SignInButton } from "@clerk/clerk-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { ChevronRight, MinimizeIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import React from "react";
import { Onboarding } from "./Onboarding";
const MIN_BIRTHDAY_DATE = new Date("1930-01-01");
const DEFAULT_ZOOM = 1;

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
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const birthdayParam = params.get("birthday");
    if (birthdayParam && isValidDate(birthdayParam)) {
      setBirthday(new Date(birthdayParam + "T00:00:00"));
    }
  }, []);

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

function useZoom(pageRef: React.RefObject<HTMLDivElement>) {
  const [zoom, setZoom] = useState<number>(DEFAULT_ZOOM);

  const resetZoom = () => setZoom(DEFAULT_ZOOM);

  // Handle zooming in and out
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.altKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        setZoom((prevZoom) =>
          Math.min(Math.max(prevZoom * delta, DEFAULT_ZOOM), 10)
        );
      }
    };

    // Add event listener for zooming
    const pageElement = pageRef.current;
    if (pageElement)
      pageElement.addEventListener("wheel", handleWheel, { passive: false });

    // Remove event listener on cleanup
    return () => {
      if (pageElement) pageElement.removeEventListener("wheel", handleWheel);
    };
  }, [pageRef]);

  return { zoom, resetZoom };
}

function useDrag(pageRef: React.RefObject<HTMLDivElement>) {
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (!e.altKey) return;

      setIsDragging(true);
      const element = pageRef.current;
      if (!element) return;

      setStartX(e.pageX - element.offsetLeft);
      setStartY(e.pageY - element.offsetTop);
      setScrollLeft(element.scrollLeft);
      setScrollTop(element.scrollTop);
      element.style.cursor = "grabbing";
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      const element = pageRef.current;
      if (!element) return;
      element.style.cursor = "default";
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !e.altKey) {
        if (isDragging) handleMouseUp();
        return;
      }

      e.preventDefault();
      const element = pageRef.current;
      if (!element) return;

      const x = e.pageX - element.offsetLeft;
      const y = e.pageY - element.offsetTop;
      const walkX = (x - startX) * 1.5;
      const walkY = (y - startY) * 1.5;

      element.scrollLeft = scrollLeft - walkX;
      element.scrollTop = scrollTop - walkY;
    };

    const pageElement = pageRef.current;
    if (pageElement) {
      pageElement.addEventListener("mousedown", handleMouseDown);
      pageElement.addEventListener("mouseleave", handleMouseUp);
      pageElement.addEventListener("mouseup", handleMouseUp);
      pageElement.addEventListener("mousemove", handleMouseMove);
    }

    return () => {
      if (pageElement) {
        pageElement.removeEventListener("mousedown", handleMouseDown);
        pageElement.removeEventListener("mouseleave", handleMouseUp);
        pageElement.removeEventListener("mouseup", handleMouseUp);
        pageElement.removeEventListener("mousemove", handleMouseMove);
      }
    };
  }, [pageRef, isDragging, startX, startY, scrollLeft, scrollTop]);
}

function didWeekPass({
  birthday,
  today,
  year,
  week,
}: {
  birthday: Date;
  today: Date;
  year: number;
  week: number;
}) {
  // Find the start of the week (Sunday) before the birthday
  const endOfBirthdayWeek = new Date(birthday);
  endOfBirthdayWeek.setDate(birthday.getDate() - birthday.getDay() + 6);
  endOfBirthdayWeek.setHours(23, 59, 59, 999);

  // Get the offset from end of birthday week to given year and week
  const endOfGivenWeek = new Date(endOfBirthdayWeek);
  endOfGivenWeek.setFullYear(endOfBirthdayWeek.getFullYear() + year);
  endOfGivenWeek.setDate(endOfBirthdayWeek.getDate() + week * 7);

  return endOfGivenWeek < today;
}

function GridCalendar({ birthday }: { birthday: Date }) {
  const today = new Date();

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
          className="text-[40px] text-center flex items-center justify-center text-gray-500 overflow-hidden bg-background sticky top-0"
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
            className="text-[40px] text-center flex items-center justify-center text-gray-500 overflow-hidden bg-background sticky left-0"
          >
            {year}
          </div>
          {Array.from({ length: 52 }).map((_, week) => (
            <div
              className={cn(
                "aspect-square border-[2px] border-black dark:border-white flex items-center justify-center",
                didWeekPass({ birthday, today, year, week })
                  ? "bg-black dark:bg-white"
                  : ""
              )}
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
        <MemoizedGridCalendar birthday={birthday} />
      </div>
      {zoom !== DEFAULT_ZOOM && (
        <Button
          className="fixed bottom-0 right-0 m-2 bg-background shadow-lg"
          variant="outline"
          size="icon"
          onClick={resetZoom}
        >
          <MinimizeIcon className="w-4 h-4" />
        </Button>
      )}
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
