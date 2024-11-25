"use client";

import { buttonVariants } from "@/components/ui/button";
import { SignInButton, SignOutButton, useUser } from "@clerk/clerk-react";
import { LogInIcon, LogOutIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useEffect,
  useState,
  ReactNode,
  createContext,
  useContext,
  useCallback,
} from "react";
import { WrapInTooltip } from "./helpers/components";

type NavbarItem = {
  key: string;
  element: ReactNode;
};

type NavbarContextType = {
  addItem: (item: NavbarItem) => void;
  removeItem: (key: string) => void;
};

export const NavbarContext = createContext<NavbarContextType | null>(null);

export function useNavbar() {
  const context = useContext(NavbarContext);
  if (!context) {
    throw new Error("useNavbar must be used within a NavbarProvider");
  }
  return context;
}

export function Navbar({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const [isMounted, setIsMounted] = useState(false);
  const [items, setItems] = useState<Record<string, ReactNode>>({});

  const addItem = useCallback(
    ({ key, element }: { key: string; element: ReactNode }) => {
      setItems((prev) => ({ ...prev, [key]: element }));
    },
    []
  );

  const removeItem = useCallback((key: string) => {
    setItems((prev) => {
      const newItems = { ...prev };
      delete newItems[key];
      return newItems;
    });
  }, []);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return <div>{children}</div>;

  return (
    <NavbarContext.Provider value={{ addItem, removeItem }}>
      <div>
        {children}
        <div className="fixed bottom-0 right-0 m-2 flex flex-row gap-1">
          {Object.values(items)}
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
    </NavbarContext.Provider>
  );
}
