"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  SignInButton,
  SignOutButton,
  useUser as useClerkUser,
} from "@clerk/clerk-react";
import {
  CheckIcon,
  LogInIcon,
  LogOutIcon,
  PlusIcon,
  UserIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useEffect,
  useState,
  ReactNode,
  createContext,
  useContext,
  useCallback,
} from "react";
import { WrapInTooltip } from "./WrapInTooltip";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { CreateAccountFlow } from "../features/create-account/CreateAccountFlow";
import { Id } from "@/convex/_generated/dataModel";

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

function ChangeAccountButton({ accountId }: { accountId: Id<"accounts"> }) {
  const accounts = useQuery(api.myFunctions.getAccountsForUser);

  const changeActiveAccount = useMutation(api.myFunctions.changeActiveAccount);
  const createNewAccountForExistingUser = useMutation(
    api.myFunctions.createNewAccountForExistingUser
  );
  const [createAccountDialogOpen, setCreateAccountDialogOpen] = useState(false);

  if (!accounts) return null;

  return (
    <div>
      <Popover>
        <PopoverTrigger asChild>
          <div>
            <WrapInTooltip text="Accounts" asChild>
              <Button
                variant="outline"
                size="icon"
                className="bg-background shadow-md"
              >
                <UserIcon className="h-4 w-4" />
              </Button>
            </WrapInTooltip>
          </div>
        </PopoverTrigger>
        <PopoverContent className="bg-background max-w-xs text-sm p-2">
          {accounts.map((account) => (
            <Button
              variant="ghost"
              className="bg-background hover:bg-hoverEmpty w-full"
              key={account._id}
              onClick={() => {
                changeActiveAccount({ accountId: account._id }).catch(
                  console.error
                );
              }}
            >
              {accountId === account._id && (
                <CheckIcon className="w-4 h-4 mr-2" />
              )}
              <p className="text-left w-full">{account.name}</p>
            </Button>
          ))}

          <Button
            variant="ghost"
            className="bg-background hover:bg-hoverEmpty w-full"
            onClick={() => setCreateAccountDialogOpen(true)}
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            <p className="text-left w-full">Add account</p>
          </Button>
        </PopoverContent>
      </Popover>

      <Dialog
        open={createAccountDialogOpen}
        onOpenChange={setCreateAccountDialogOpen}
      >
        <DialogContent className="!animate-none">
          <DialogTitle>Create new account</DialogTitle>
          <CreateAccountFlow
            onSubmit={(name, birthday) => {
              createNewAccountForExistingUser({ name, birthday }).catch(
                console.error
              );
              setCreateAccountDialogOpen(false);
            }}
            hideButtonIfNotValid={false}
            copy={{
              name: "Account name",
              birthday: "Birthday",
              button: "Create",
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ChangeAccountButtonContainer() {
  const activeAccount = useQuery(api.myFunctions.getActiveAccount);
  if (!activeAccount) return null;

  return <ChangeAccountButton accountId={activeAccount._id} />;
}

export function Navbar({ children }: { children: React.ReactNode }) {
  const { user: clerkUser } = useClerkUser();
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
          {clerkUser && <ChangeAccountButtonContainer />}
          {clerkUser ? (
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
