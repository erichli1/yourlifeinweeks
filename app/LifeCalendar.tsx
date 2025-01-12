"use client";

import { Button } from "@/components/ui/button";
import { ArrowRightIcon, MinimizeIcon, PlusIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  didYearWeekPassRelativeToToday,
  getCurrentYearWeekRelativeToBirthday,
  getDatesFromWeekNumber,
  renderDate,
  YearWeek,
} from "./helpers/date-utils";
import { useZoom, useDrag, DEFAULT_ZOOM } from "./helpers/interactions";
import { WrapInTooltip } from "./helpers/components";
import { User } from "./helpers/utils";
import { debounce } from "lodash";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { WeekSheetContent } from "./week/WeekSheet";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { FitText } from "./helpers/fit-text";
import { getWeekBoxCustomColor } from "./helpers/colors";
import { Color } from "@/convex/utils";
import { CmdK } from "./helpers/cmd-k";
import { useMediaQuery } from "react-responsive";
import { MobileWeekContainer } from "./week/MobileWeek";
import { useNavbar } from "./Navbar";
import * as Dialog from "@radix-ui/react-dialog";
import YearWeekInput from "./helpers/YearWeekInput";

function WeekBoxPopover({
  user,
  yearWeek,
}: {
  user: User;
  yearWeek: YearWeek;
}) {
  const { start, end } = getDatesFromWeekNumber({
    birthday: user.birthday,
    yearWeek,
  });

  return (
    <div className="text-xs">
      <span className="font-bold">
        Year {yearWeek.year}, Week {yearWeek.week}
      </span>{" "}
      ({renderDate(start, "MM/DD/YY")} - {renderDate(end, "MM/DD/YY")})
    </div>
  );
}

function WeekBox({
  isFilled,
  year,
  week,
  user,
  displayProps,
  setSelectedYearWeek,
}: {
  isFilled: boolean;
  year: number;
  week: number;
  user: User;
  displayProps?: DisplayProps;
  setSelectedYearWeek: (yearWeek: YearWeek) => void;
}) {
  const [isHovering, setIsHovering] = useState(false);

  const modifyHoveringState = useCallback((value: boolean) => {
    setIsHovering(value);
  }, []);

  const debouncedSendRequest = useMemo(() => {
    return debounce(modifyHoveringState, 250);
  }, [modifyHoveringState]);

  return (
    <Popover open={isHovering}>
      <PopoverTrigger asChild>
        <div
          className={cn(
            "aspect-square flex items-center justify-center rounded-lg cursor-pointer",
            "transition-colors transition-transform",
            isFilled ? "bg-filled" : "bg-empty border-filled border-[2px]",
            isFilled ? "hover:bg-hoverFilled" : "hover:bg-hoverEmpty",
            displayProps?.color
              ? getWeekBoxCustomColor(displayProps.color, true)
              : ""
          )}
          onMouseEnter={() => debouncedSendRequest(true)}
          onMouseLeave={() => debouncedSendRequest(false)}
          onClick={() => setSelectedYearWeek({ year, week })}
        >
          {displayProps?.displayName && (
            <FitText text={displayProps.displayName} className="" />
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="bg-background w-fit p-2 pointer-events-none"
        side="top"
      >
        <WeekBoxPopover user={user} yearWeek={{ year, week }} />
      </PopoverContent>
    </Popover>
  );
}

const MemoizedWeekBox = React.memo(WeekBox);

type DisplayProps = {
  displayName?: string;
  color?: Color;
  year: number;
  week: number;
};

function GridCalendar({ user }: { user: User }) {
  const [selectedYearWeek, setSelectedYearWeek] = useState<YearWeek | null>(
    null
  );

  const displayProps = useQuery(api.myFunctions.getDisplayProps);

  const displayPropsMap: Map<
    number,
    Map<number, DisplayProps>
  > = useMemo(() => {
    const map = new Map<number, Map<number, DisplayProps>>();

    if (displayProps)
      displayProps.forEach(({ year, week, displayName, color }) => {
        map.set(
          year,
          (map.get(year) || new Map()).set(week, {
            displayName,
            color,
          })
        );
      });

    return map;
  }, [displayProps]);

  if (!displayProps) return <></>;

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
          className="text-[40px] text-center flex items-center justify-center overflow-hidden bg-background sticky top-0 select-none"
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
            className="text-[40px] text-center flex items-center justify-center overflow-hidden bg-background sticky left-0 select-none"
          >
            {year}
          </div>
          {Array.from({ length: 52 }).map((_, week0Indexed) => (
            <MemoizedWeekBox
              isFilled={didYearWeekPassRelativeToToday({
                birthday: user.birthday,
                yearWeek: { year, week: week0Indexed + 1 },
              })}
              user={user}
              year={year}
              week={week0Indexed + 1}
              key={`cell-${year}-${week0Indexed + 1}`}
              displayProps={displayPropsMap.get(year)?.get(week0Indexed + 1)}
              setSelectedYearWeek={setSelectedYearWeek}
            />
          ))}
          <div />
        </React.Fragment>
      ))}

      <Sheet
        open={!!selectedYearWeek}
        onOpenChange={(open) => {
          if (!open) setSelectedYearWeek(null);
        }}
      >
        <SheetContent side="right" className="p-0 sm:max-w-full">
          {/* Radix requires title & description to be set */}
          <SheetTitle />
          <SheetDescription />
          {selectedYearWeek && (
            <WeekSheetContent user={user} yearWeek={selectedYearWeek} />
          )}
        </SheetContent>
      </Sheet>

      <CmdK birthday={user.birthday} setYearWeek={setSelectedYearWeek} />
    </div>
  );
}

const MemoizedGridCalendar = React.memo(GridCalendar);

export function LifeCalendar({ user }: { user: User }) {
  const pageRef = useRef<HTMLDivElement>(null);
  const { zoom, resetZoom } = useZoom(pageRef);
  useDrag(pageRef);

  const isMobile = useMediaQuery({ query: "(max-width: 640px)" });

  if (isMobile) return <MobileComponent user={user} />;

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
        <MemoizedGridCalendar user={user} />
      </div>
      <div className="fixed bottom-0 left-0 m-2 flex flex-row gap-1">
        {zoom !== DEFAULT_ZOOM && (
          <WrapInTooltip text="Reset zoom" asChild>
            <Button
              className="bg-background shadow-lg"
              variant="outline"
              size="icon"
              onClick={resetZoom}
            >
              <MinimizeIcon className="w-4 h-4" />
            </Button>
          </WrapInTooltip>
        )}
      </div>
    </div>
  );
}

function MobileComponent({ user }: { user: User }) {
  const displayProps = useQuery(api.myFunctions.getDisplayProps);
  const [addMomentOpen, setAddMomentOpen] = useState(false);

  const { addItem, removeItem } = useNavbar();

  useEffect(() => {
    if (user.signedIn) {
      addItem({
        key: "addMoment",
        element: (
          <Button
            variant="outline"
            size="icon"
            className="bg-background shadow-md"
            key="add-moment"
            onClick={() => setAddMomentOpen(true)}
          >
            <PlusIcon className="h-4 w-4" />
          </Button>
        ),
      });
    }
  }, [addItem, removeItem, user.signedIn]);

  if (!displayProps) return <></>;

  const currentYearWeek = getCurrentYearWeekRelativeToBirthday(user.birthday);

  return (
    <div className="p-4 flex flex-col gap-16 pb-6">
      <p className="font-bold text-2xl">
        Welcome to year {currentYearWeek.year}, week {currentYearWeek.week}.
      </p>

      {user.signedIn && (
        <>
          {displayProps.map((displayProps, idx) => (
            <MobileWeekContainer
              user={user}
              displayProps={displayProps}
              key={`mobile-week-${idx}`}
            />
          ))}
        </>
      )}

      {!user.signedIn && (
        <div className="flex flex-row gap-2 items-start">
          <p>Sign in to add moments!</p>
        </div>
      )}

      <CreateMomentDialog
        user={user}
        open={addMomentOpen}
        setOpen={setAddMomentOpen}
      />
    </div>
  );
}

function CreateMomentDialog({
  user,
  open,
  setOpen,
}: {
  user: User;
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  const getOrCreateMomentForYearWeek = useMutation(
    api.myFunctions.getOrCreateMomentForYearWeek
  );

  const [date, setDate] = useState<Date | null | undefined>(null);
  const [yearWeek, setYearWeek] = useState<YearWeek | null | undefined>(null);

  const textToRender = (() => {
    if (yearWeek === undefined || date === undefined) return null;
    if (date === null) return "Invalid date";

    // Invalid yearWeek
    if (yearWeek === null) {
      // Valid date
      if (date)
        return `${renderDate(date, "MMM DD YYYY")} (not on the calendar!)`;
      // Invalid date
      else return "Invalid date";
    }

    // Valid date & yearWeek
    return `${renderDate(date, "MMM DD YYYY")} (year ${yearWeek.year}, week ${yearWeek.week})`;
  })();

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Title />
        <Dialog.Description />
        <Dialog.Overlay className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 bg-background -translate-x-1/2 -translate-y-1/2 rounded-md focus:outline-none z-50 shadow-lg p-2 max-w-xs w-full">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-bold">
              Enter date to go to or create moment
            </p>

            <YearWeekInput
              birthday={user.birthday}
              setValues={(yearWeek, date) => {
                setYearWeek(yearWeek);
                setDate(date);
              }}
              props={{
                placeholder: "yesterday, jan 21 2024",
              }}
            />

            {textToRender && <p className="text-sm italic">{textToRender}</p>}

            {yearWeek && (
              <div className="flex flex-row justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    getOrCreateMomentForYearWeek({
                      year: yearWeek.year,
                      week: yearWeek.week,
                      name: "",
                    })
                      .then(() => setOpen(false))
                      .catch(console.error);
                  }}
                >
                  Go <ArrowRightIcon className="ml-1 h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
