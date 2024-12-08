"use client";

import { Button } from "@/components/ui/button";
import {
  Authenticated,
  Unauthenticated,
  useQuery,
  useMutation,
} from "convex/react";
import { api } from "@/convex/_generated/api";
import { SignInButton } from "@clerk/clerk-react";
import { Input } from "@/components/ui/input";
import { ChevronRight } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Onboarding } from "./Onboarding";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
import { LifeCalendar } from "./LifeCalendar";
import { User } from "./helpers/utils";
import { Navbar } from "./Navbar";
import { cn } from "@/lib/utils";

const MIN_BIRTHDAY_DATE = new Date("1940-01-01");

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

  if (!birthday) return <InitialState />;

  if (!onboardingComplete)
    return (
      <Onboarding
        birthday={birthday}
        setOnboardingComplete={setOnboardingComplete}
      />
    );

  const user: User = {
    signedIn: false,
    birthday,
  };

  return <LifeCalendar user={user} />;
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

export function CreateAccountFlow({
  onSubmit,
  className,
  copy,
  hideButtonIfNotValid = true,
}: {
  onSubmit: (name: string, birthday: number) => void;
  className?: string;
  copy?: Partial<{
    name: string;
    birthday: string;
    button: string;
  }>;
  hideButtonIfNotValid?: boolean;
}) {
  const [birthday, setBirthday] = useState<string>("");
  const [name, setName] = useState<string>("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const birthdayParam = params.get("birthday");
    if (birthdayParam && isValidDate(birthdayParam)) setBirthday(birthdayParam);
  }, []);

  const canSubmit = isValidDate(birthday) && name.length > 0;

  const handleSubmit = () =>
    onSubmit(name, new Date(birthday + "T00:00:00").getTime());

  const actualCopy = {
    name: "What's your name?",
    birthday: "What's your birthday?",
    button: "All done",
    ...copy,
  };

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="grid w-full max-w-sm gap-1.5">
        <Label htmlFor="name">{actualCopy.name}</Label>
        <Input
          type="text"
          id="name"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="grid w-full max-w-sm items-center gap-1.5">
        <Label htmlFor="birthday">{actualCopy.birthday}</Label>
        <DatePicker date={birthday} setDate={setBirthday} />
      </div>

      {!hideButtonIfNotValid || canSubmit ? (
        <div className="w-full max-w-sm">
          <Button onClick={handleSubmit}>{actualCopy.button}</Button>
        </div>
      ) : null}
    </div>
  );
}

function SignedInContent() {
  const account = useQuery(api.myFunctions.getActiveAccount);
  const initializeUserAndAccount = useMutation(
    api.myFunctions.initializeUserAndAccount
  );

  // Remove URL params if account is found
  useEffect(() => {
    if (account) {
      const url = new URL(window.location.href);
      url.search = "";
      window.history.replaceState({}, "", url);
    }
  }, [account]);

  if (account === undefined) return <LoadingScreen />;
  if (account === null)
    return (
      <CreateAccountFlow
        className="h-screen items-center justify-center p-4"
        onSubmit={(name, birthday) => {
          initializeUserAndAccount({
            name,
            birthday,
          }).catch(console.error);
        }}
      />
    );

  return (
    <LifeCalendar
      user={{
        signedIn: true,
        birthday: new Date(account.birthday),
        account,
      }}
    />
  );
}

function LoadingScreen() {
  return (
    <div className="h-screen flex items-center justify-center">Loading...</div>
  );
}
