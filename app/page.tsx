"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Authenticated,
  Unauthenticated,
  useQuery,
  useMutation,
} from "convex/react";
import { api } from "@/convex/_generated/api";
import { SignInButton, SignOutButton, useUser } from "@clerk/clerk-react";
import { Input } from "@/components/ui/input";
import { ChevronRight, LogInIcon, LogOutIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import React, { useEffect, useState } from "react";
import { Onboarding } from "./Onboarding";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
import { LifeCalendar } from "./LifeCalendar";
import { WrapInTooltip } from "./helpers/components";

const MIN_BIRTHDAY_DATE = new Date("1940-01-01");

const isValidDate = (dateStr: string) => {
  const parsedDate = Date.parse(dateStr);

  return (
    parsedDate >= MIN_BIRTHDAY_DATE.getTime() &&
    parsedDate <= new Date().getTime()
  );
};

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
              <div
                className={cn(
                  buttonVariants({ variant: "outline", size: "icon" }),
                  "bg-background shadow-md"
                )}
              >
                <LogOutIcon className="h-4 w-4" />
              </div>
            </SignOutButton>
          </WrapInTooltip>
        ) : (
          <WrapInTooltip text="Sign in">
            <SignInButton mode="modal" redirectUrl={window.location.href}>
              <div
                className={cn(
                  buttonVariants({ variant: "outline", size: "icon" }),
                  "bg-background shadow-md"
                )}
              >
                <LogInIcon className="w-4 h-4" />
              </div>
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
