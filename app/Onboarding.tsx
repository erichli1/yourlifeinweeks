import { cn } from "@/lib/utils";
import React from "react";
import { Stage, TitleMap, StageList, DelayMap, ViewMap } from "./utils";

const DURATION_OF_DROP_IN_ANIMATION = 500;
const INCREMENT_DURATION_OF_DROP_IN_ANIMATION = 50;

const onboardingSquareClasses =
  "aspect-square border-[1px] border-black dark:border-white";
const fadeInClasses = "animate-in fade-in";
const duration500Ms = "duration-500";
const duration1000Ms = "duration-1000";
const SIZE_OF_BIG_WEEK = "w-[8rem]";
const SIZE_OF_WEEK_IN_YEAR = "w-[calc((100vw-102px-2rem)/52)]";

function Title({ stage }: { stage: Stage }) {
  const title = TitleMap[stage];

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

function ComponentFor90x52({ stage }: { stage: Stage }) {
  return (
    <>
      {/* First row of 52 cells, tracked separately for transitions */}
      {Array.from({ length: 52 }).map((_, i) => (
        <div key={i} className={cn(onboardingSquareClasses)} />
      ))}

      {/* Remaining 89 years of life */}
      {stage === "oneFullLife" &&
        Array.from({ length: 89 }).map((_, i) =>
          Array.from({ length: 52 }).map((_, j) => (
            <div
              key={`${i}-${j}`}
              className={cn(onboardingSquareClasses)}
              style={{
                opacity: 0,
                animation: incrementalAnimation(i),
              }}
            />
          ))
        )}
    </>
  );
}

export function Onboarding() {
  const [stage, setStage] = React.useState<Stage>("oneBigWeek");

  React.useEffect(() => {
    const timers = StageList.filter((s) => s !== "oneBigWeek").map((stage) =>
      setTimeout(() => setStage(stage as Stage), DelayMap[stage])
    );

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="h-screen flex flex-col items-center justify-center gap-4 p-4">
      <Title stage={stage} />

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
        {ViewMap[stage] === "90x52" && <ComponentFor90x52 stage={stage} />}
      </div>
    </div>
  );
}
