import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { HelpCircleIcon, UserIcon } from "lucide-react";

export function HelpButton({
  signedIn,
  isMobile,
}: {
  signedIn: boolean;
  isMobile: boolean;
}) {
  if (isMobile) return <></>;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          className="bg-background shadow-lg"
          variant="outline"
          size="icon"
        >
          <HelpCircleIcon className="w-4 h-4" />
        </Button>
      </DialogTrigger>

      <DialogContent className="!animate-none">
        <DialogHeader>
          <DialogTitle>some useful tips</DialogTitle>
          <DialogDescription className="flex flex-col gap-1">
            <p>Hit ⌘ + K to quickly navigate to a week</p>

            <p>Hold ⌥ and scroll to zoom in and out</p>

            {signedIn && (
              <p>
                Click the <UserIcon className="w-4 h-4 inline" /> icon to create
                new accounts (ex: for parents, work journal, etc.)
              </p>
            )}
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
