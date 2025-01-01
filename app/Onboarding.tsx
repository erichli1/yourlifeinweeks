import { cn } from "@/lib/utils";
import React from "react";
import {
  getCurrentYearWeekRelativeToBirthday,
  YearWeek,
  addOrdinalSuffix,
} from "./helpers/date-utils";
import { useNavbar } from "./Navbar";
import { WrapInTooltip } from "./helpers/components";
import { Button } from "@/components/ui/button";
import { FastForwardIcon } from "lucide-react";

const DURATION_OF_DROP_IN_ANIMATION = 500;
const INCREMENT_DURATION_OF_DROP_IN_ANIMATION = 50;

const onboardingSquareClasses = "aspect-square border-[1px] border-filled";
const fadeInClasses = "animate-in fade-in";
const duration500Ms = "duration-500";
const duration1000Ms = "duration-1000";
const SIZE_OF_BIG_WEEK = "w-[8rem]";
const SIZE_OF_WEEK_IN_YEAR = "w-[calc((100vw-102px-2rem)/52)]";

const StageList = [
  "oneBigWeek",
  "oneSmallWeek",
  "oneFullYear",
  "oneSmallYear",
  "oneFullLife",
  "oneFilledLife",
] as const;

type Stage = (typeof StageList)[number];

const getNextStage = (stage: Stage): Stage | null => {
  const index = StageList.indexOf(stage);

  if (index === StageList.length - 1) return null;
  else return StageList[index + 1];
};

const StageDirections: Record<
  Stage,
  {
    view: "1x52" | "90x52";
    timeToSwitch: number | null;
    title: (week: number, year: number) => string | null;
  }
> = {
  oneBigWeek: {
    view: "1x52",
    timeToSwitch: 2000,
    title: () => "This is one week of your life.",
  },
  oneSmallWeek: { view: "1x52", timeToSwitch: 2000, title: () => null },
  oneFullYear: {
    view: "1x52",
    timeToSwitch: 4000,
    title: () => "This is one year of your life.",
  },
  oneSmallYear: { view: "90x52", timeToSwitch: 1000, title: () => null },
  oneFullLife: {
    view: "90x52",
    timeToSwitch: 9000,
    title: () => "This is your life.",
  },
  oneFilledLife: {
    view: "90x52",
    timeToSwitch: null,
    title: (week, year) => `Welcome to the ${addOrdinalSuffix(week)} week of
        your ${addOrdinalSuffix(year)} year of life.`,
  },
};

function Title({ title }: { title: string | null }) {
  if (!title) return <div>&nbsp;</div>;

  return <div className={cn(fadeInClasses, duration500Ms)}>{title}</div>;
}

const incrementalAnimation = (counter: number) =>
  `enter ${DURATION_OF_DROP_IN_ANIMATION}ms ease-out ${(counter + 1) * INCREMENT_DURATION_OF_DROP_IN_ANIMATION}ms forwards`;

function ComponentFor1x52({ stage }: { stage: Stage }) {
  return (
    <>
      <div
        className={cn(
          onboardingSquareClasses,
          duration1000Ms,
          "transition-all",
          "absolute top-0",
          stage === "oneBigWeek" &&
            cn("left-1/2 transform -translate-x-1/2", SIZE_OF_BIG_WEEK),
          (stage === "oneSmallWeek" || stage === "oneFullYear") &&
            cn("left-0 transform-none", SIZE_OF_WEEK_IN_YEAR)
        )}
      />

      {stage === "oneSmallWeek" && (
        <div className={cn(SIZE_OF_WEEK_IN_YEAR)}>&nbsp;</div>
      )}

      {stage === "oneFullYear" && (
        <>
          {/* Empty padding cell to account for transformed big week */}
          <div className={cn(SIZE_OF_WEEK_IN_YEAR)} />
          {/* 51 additional cells, one for each week of the year */}
          {Array.from({ length: 51 }).map((_, i) => (
            <div
              key={i + 1}
              className={cn(
                onboardingSquareClasses,
                fadeInClasses,
                duration500Ms,
                "slide-in-from-top fill-mode-forwards"
              )}
              style={{
                opacity: 0,
                animation: incrementalAnimation(i),
              }}
            />
          ))}
        </>
      )}
    </>
  );
}

const MemoizedBox = React.memo(function Box({
  isFilled,
  row,
}: {
  isFilled: boolean;
  row: number;
}) {
  return (
    <div
      className={cn(
        onboardingSquareClasses,
        "transition-colors",
        duration500Ms,
        isFilled ? "bg-filled" : "bg-background"
      )}
      style={{
        opacity: 0,
        animation: incrementalAnimation(row),
      }}
    />
  );
});

function ComponentFor90x52({
  stage,
  todayRelativeToBirthday,
  setOnboardingComplete,
}: {
  stage: Stage;
  todayRelativeToBirthday: YearWeek;
  setOnboardingComplete: (complete: boolean) => void;
}) {
  const [rowFilling, setRowFilling] = React.useState<number>(0);
  const [columnFilling, setColumnFilling] = React.useState<number>(0);

  React.useEffect(() => {
    let timer: NodeJS.Timeout;

    if (stage === "oneFilledLife") {
      timer = setTimeout(() => {
        if (
          todayRelativeToBirthday.year <= rowFilling &&
          todayRelativeToBirthday.week <= columnFilling
        )
          setTimeout(() => {
            setOnboardingComplete(true);
          }, 5000);
        else if (columnFilling < 51) {
          if (rowFilling === todayRelativeToBirthday.year || rowFilling === 0)
            setColumnFilling((prev) => prev + 1);
          else if (
            rowFilling === todayRelativeToBirthday.year - 1 ||
            rowFilling === 1
          )
            setColumnFilling((prev) => prev + 2);
          else setColumnFilling((prev) => prev + 4);
        } else {
          setRowFilling((prev) => prev + 1);
          setColumnFilling(0);
        }
      }, 5);
    }

    return () => clearTimeout(timer);
  }, [
    columnFilling,
    rowFilling,
    setOnboardingComplete,
    stage,
    todayRelativeToBirthday,
  ]);

  return (
    <>
      {/* First row of 52 cells, tracked separately for transitions */}
      {Array.from({ length: 52 }).map((_, j) => (
        <MemoizedBox
          key={j}
          isFilled={0 < rowFilling || (0 === rowFilling && j < columnFilling)}
          row={0}
        />
      ))}

      {/* Remaining 89 years of life */}
      {(stage === "oneFullLife" || stage === "oneFilledLife") &&
        Array.from({ length: 89 }).map((_, i) =>
          Array.from({ length: 52 }).map((_, j) => (
            <MemoizedBox
              key={`${i}-${j}`}
              isFilled={
                i + 1 < rowFilling ||
                (i + 1 === rowFilling && j < columnFilling)
              }
              row={i + 1}
            />
          ))
        )}
    </>
  );
}

function SkipOnboardingButton({
  setOnboardingComplete,
}: {
  setOnboardingComplete: (complete: boolean) => void;
}) {
  return (
    <WrapInTooltip text="Skip">
      <Button
        variant="outline"
        size="icon"
        className="bg-background shadow-md"
        onClick={() => setOnboardingComplete(true)}
      >
        <FastForwardIcon className="h-4 w-4" />
      </Button>
    </WrapInTooltip>
  );
}

export function Onboarding({
  birthday,
  setOnboardingComplete,
}: {
  birthday: Date;
  setOnboardingComplete: (complete: boolean) => void;
}) {
  const [stage, setStage] = React.useState<Stage>("oneBigWeek");
  const currStageDirections = StageDirections[stage];

  const { addItem, removeItem } = useNavbar();

  const todayRelativeToBirthday =
    getCurrentYearWeekRelativeToBirthday(birthday);

  // Handle stage transitions
  React.useEffect(() => {
    const nextStage = getNextStage(stage);
    let timeOutId: NodeJS.Timeout;

    if (nextStage && currStageDirections.timeToSwitch) {
      timeOutId = setTimeout(
        () => setStage(nextStage),
        currStageDirections.timeToSwitch
      );
    }

    return () => clearTimeout(timeOutId);
  }, [stage, setStage, currStageDirections]);

  // Add skip onboarding button to the navbar
  React.useEffect(() => {
    addItem({
      key: "skipOnboarding",
      element: (
        <SkipOnboardingButton setOnboardingComplete={setOnboardingComplete} />
      ),
    });

    return () => {
      removeItem("skipOnboarding");
    };
  }, [addItem, removeItem, setOnboardingComplete]);

  return (
    <div className="h-screen flex flex-col items-center justify-center gap-4 p-4">
      <Title
        title={currStageDirections.title(
          todayRelativeToBirthday.week,
          todayRelativeToBirthday.year
        )}
      />

      <div
        className={cn(
          "relative grid gap-[2px] w-full",
          fadeInClasses,
          duration500Ms
        )}
        style={{
          gridTemplateColumns: "repeat(52, minmax(0, 1fr))",
          height:
            currStageDirections.view === "90x52"
              ? "min(95vh, (95vw * 90) / 52)"
              : "calc((100vw - 2rem) / 52)",
          width:
            currStageDirections.view === "90x52"
              ? "min(95vw, (95vh * 52) / 90)"
              : "calc(100vw - 2rem)",
        }}
      >
        {currStageDirections.view === "1x52" && (
          <ComponentFor1x52 stage={stage} />
        )}

        {currStageDirections.view === "90x52" && (
          <ComponentFor90x52
            stage={stage}
            todayRelativeToBirthday={todayRelativeToBirthday}
            setOnboardingComplete={setOnboardingComplete}
          />
        )}
      </div>
    </div>
  );
}
