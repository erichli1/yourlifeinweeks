import { useState, useEffect, useCallback, useMemo } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  Command,
  CommandInput,
  CommandList,
  CommandItem,
  CommandShortcut,
} from "@/components/ui/command";
import {
  getYearWeekOfDate,
  isValidYearWeek,
  parseDateTime,
  renderDate,
  YearWeek,
} from "../../../lib/date-utils";
import { debounce } from "lodash";
import { cn } from "@/lib/utils";

const COMMAND_ITEM_CLASSES = "pl-4 py-4 text-center text-sm";

function CommandMenu({
  birthday,
  setYearWeek,
  setOpen,
}: {
  birthday: Date;
  setYearWeek: (yearWeek: YearWeek) => void;
  setOpen: (open: boolean) => void;
}) {
  const [dateString, setDateString] = useState("");

  // null means unable to parse, undefined means no date has been set
  const [processedDate, setProcessedDate] = useState<Date | null | undefined>(
    undefined
  );

  // null means invalid yearWeek, undefined means no yearWeek has been set
  const [processedYearWeek, setProcessedYearWeek] = useState<
    YearWeek | null | undefined
  >(undefined);

  const updateProcessedDate = useCallback((currDateStr: string) => {
    setProcessedDate(parseDateTime(currDateStr));
  }, []);
  const debouncedUpdateProcessedDate = useMemo(() => {
    return debounce(updateProcessedDate, 250);
  }, [updateProcessedDate]);

  // Update processedYearWeek based on processedDate
  useEffect(() => {
    if (!processedDate) {
      setProcessedYearWeek(processedDate);
      return;
    }

    const yearWeek = getYearWeekOfDate({ birthday, date: processedDate });

    if (isValidYearWeek(yearWeek)) setProcessedYearWeek(yearWeek);
    else setProcessedYearWeek(null);
  }, [birthday, processedDate]);

  // When user presses enter, trigger the setYearWeek function
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && processedYearWeek) {
        setYearWeek(processedYearWeek);
        setOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [birthday, processedDate, processedYearWeek, setOpen, setYearWeek]);

  return (
    <Command className="bg-background border-2" shouldFilter={false}>
      <CommandInput
        placeholder={`Quick nav (e.g. yesterday, jan 21 2024)`}
        value={dateString}
        onValueChange={(newValue) => {
          setDateString(newValue);
          if (newValue === "") setProcessedDate(undefined);
          else debouncedUpdateProcessedDate(newValue);
        }}
      />
      <CommandList>
        {processedDate === null && (
          <CommandItem className={cn(COMMAND_ITEM_CLASSES)}>
            Unable to find date
          </CommandItem>
        )}
        {processedDate &&
          (processedYearWeek ? (
            <CommandItem className={cn(COMMAND_ITEM_CLASSES)}>
              <p>
                {renderDate(processedDate, "MMM DD YYYY")} (year{" "}
                {processedYearWeek.year}, week {processedYearWeek.week})
              </p>

              <CommandShortcut>
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                  return
                </kbd>
              </CommandShortcut>
            </CommandItem>
          ) : (
            <CommandItem className={cn(COMMAND_ITEM_CLASSES)}>
              {renderDate(processedDate, "MMM DD YYYY")} (not on the calendar!)
            </CommandItem>
          ))}
      </CommandList>
    </Command>
  );
}

export function CmdK({
  birthday,
  setYearWeek,
}: {
  birthday: Date;
  setYearWeek: (yearWeek: YearWeek) => void;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey && e.key === "k") setOpen((prev) => !prev);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Title />
        <Dialog.Description />
        <Dialog.Content className="fixed left-1/2 top-1/2 bg-background max-w-sm w-full -translate-x-1/2 -translate-y-1/2 rounded-md focus:outline-none z-50 shadow-lg ">
          <CommandMenu
            birthday={birthday}
            setYearWeek={setYearWeek}
            setOpen={setOpen}
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
