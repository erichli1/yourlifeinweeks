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
import { ChevronRight } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Onboarding } from "../components/features/onboarding/Onboarding";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LifeCalendar } from "../components/features/life-calendar/LifeCalendar";
import { User } from "./helpers/utils";
import { Navbar } from "../components/shared/navbar";
import { CreateAccountFlow } from "../components/features/create-account/CreateAccountFlow";
import { DatePicker, isValidDate } from "../components/shared/DatePicker";

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
        setOnboardingComplete={(complete) => {
          setOnboardingComplete(complete);
          const params = new URLSearchParams(window.location.search);
          params.set("onboarding", "false");
          window.location.search = params.toString();
        }}
      />
    );

  const user: User = {
    signedIn: false,
    birthday,
  };

  return <LifeCalendar user={user} />;
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
