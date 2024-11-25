"use client";

import { buttonVariants } from "@/components/ui/button";
import { SignInButton, SignOutButton, useUser } from "@clerk/clerk-react";
import { LogInIcon, LogOutIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import React, { useEffect, useState } from "react";
import { WrapInTooltip } from "./helpers/components";

export function Navbar({ children }: { children: React.ReactNode }) {
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
