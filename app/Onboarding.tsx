import { cn } from "@/lib/utils";
import React from "react";
import {
  getCurrentYearWeekRelativeToBirthday,
  YearWeek,
  addOrdinalSuffix,
} from "./helpers/utils";

const DURATION_OF_DROP_IN_ANIMATION = 500;
const INCREMENT_DURATION_OF_DROP_IN_ANIMATION = 50;

const onboardingSquareClasses =
  "aspect-square border-[1px] border-black dark:border-white";
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

type View = "1x52" | "90x52";

const ViewMap: Record<Stage, View> = {
  oneBigWeek: "1x52",
  oneSmallWeek: "1x52",
  oneFullYear: "1x52",
  oneSmallYear: "90x52",
  oneFullLife: "90x52",
  oneFilledLife: "90x52",
};

const DelayMap: Record<Stage, number> = {
  oneBigWeek: 0,
  oneSmallWeek: 2000,
  oneFullYear: 4000,
  oneSmallYear: 8000,
  oneFullLife: 9000,
  oneFilledLife: 18000,
};

const TitleMap: Record<Stage, string | null> = {
  oneBigWeek: "This is one week of your life.",
  oneSmallWeek: null,
  oneFullYear: "This is one year of your life.",
  oneSmallYear: null,
  oneFullLife: "This is your life.",
  // PLACEHOLDER TEXT, OVERRIDEN IN COMPONENT
  oneFilledLife: "This is how you've lived your life.",
};

function Title({
  stage,
  todayRelativeToBirthday,
}: {
  stage: Stage;
  todayRelativeToBirthday: YearWeek;
}) {
  const title = TitleMap[stage];

  if (!title) return <div>&nbsp;</div>;
  if (stage === "oneFilledLife")
    return (
      <div className={cn(fadeInClasses, duration500Ms)}>
        Welcome to the {addOrdinalSuffix(todayRelativeToBirthday.week)} week of
        your {addOrdinalSuffix(todayRelativeToBirthday.year - 1)} year of life.
      </div>
    );
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
        isFilled ? "bg-black dark:bg-white" : "bg-background"
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
          setOnboardingComplete(true);
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

export function Onboarding({
  birthday,
  setOnboardingComplete,
}: {
  birthday: Date;
  setOnboardingComplete: (complete: boolean) => void;
}) {
  const [stage, setStage] = React.useState<Stage>("oneBigWeek");

  const todayRelativeToBirthday =
    getCurrentYearWeekRelativeToBirthday(birthday);

  React.useEffect(() => {
    const timers = StageList.filter((s) => s !== "oneBigWeek").map((stage) =>
      setTimeout(() => setStage(stage as Stage), DelayMap[stage])
    );

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="h-screen flex flex-col items-center justify-center gap-4 p-4">
      <Title stage={stage} todayRelativeToBirthday={todayRelativeToBirthday} />

      <div
        className={cn(
          "relative grid gap-[2px] w-full",
          fadeInClasses,
          duration500Ms
        )}
        style={{
          gridTemplateColumns: "repeat(52, minmax(0, 1fr))",
          height:
            ViewMap[stage] === "90x52"
              ? "min(95vh, (95vw * 90) / 52)"
              : "calc((100vw - 2rem) / 52)",
          width:
            ViewMap[stage] === "90x52"
              ? "min(95vw, (95vh * 52) / 90)"
              : "calc(100vw - 2rem)",
        }}
      >
        {ViewMap[stage] === "1x52" && <ComponentFor1x52 stage={stage} />}
        {ViewMap[stage] === "90x52" && (
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
