import { cn } from "@/lib/utils";
import React from "react";

const DELAY_TO_MINIMIZE_ONE_WEEK = 2000;
const DELAY_TO_SHOW_ONE_FULL_YEAR = 4000;
const DELAY_TO_SHOW_ONE_SMALL_YEAR = 8000;
const DELAY_TO_SHOW_ONE_FULL_LIFE = 9000;

const DURATION_OF_WEEK_DROP_IN_ANIMATION = 500;
const INCREMENT_DURATION_OF_WEEK_DROP_IN_ANIMATION = 50;
const DURATION_OF_YEAR_DROP_IN_ANIMATION = 500;
const INCREMENT_DURATION_OF_YEAR_DROP_IN_ANIMATION = 50;

export function Onboarding() {
  const [stage, setStage] = React.useState<
    | "oneBigWeek"
    | "oneSmallWeek"
    | "oneFullYear"
    | "oneSmallYear"
    | "oneFullLife"
  >("oneBigWeek");

  React.useEffect(() => {
    const smallTimer = setTimeout(() => {
      setStage("oneSmallWeek");
    }, DELAY_TO_MINIMIZE_ONE_WEEK);

    const oneFullYearTimer = setTimeout(() => {
      setStage("oneFullYear");
    }, DELAY_TO_SHOW_ONE_FULL_YEAR);

    const oneSmallYearTimer = setTimeout(() => {
      setStage("oneSmallYear");
    }, DELAY_TO_SHOW_ONE_SMALL_YEAR);

    const fullLifeTimer = setTimeout(() => {
      setStage("oneFullLife");
    }, DELAY_TO_SHOW_ONE_FULL_LIFE);

    return () => {
      clearTimeout(smallTimer);
      clearTimeout(oneFullYearTimer);
      clearTimeout(oneSmallYearTimer);
      clearTimeout(fullLifeTimer);
    };
  }, []);

  return (
    <div className="h-screen flex items-center justify-center flex-col gap-4 animate-in fade-in duration-500 p-4">
      {stage === "oneBigWeek" && <div>This is one week of your life.</div>}
      {stage === "oneSmallWeek" && <div>&nbsp;</div>}
      {stage === "oneFullYear" && (
        <div className="animate-in fade-in duration-500">
          This is one year of your life.
        </div>
      )}
      {stage === "oneSmallYear" && <div>&nbsp;</div>}
      {stage === "oneFullLife" && (
        <div className="animate-in fade-in duration-500">
          This is your life.
        </div>
      )}

      <div
        className="relative grid gap-[2px] w-full transition-all duration-1000"
        style={{
          gridTemplateColumns: "repeat(52, minmax(0, 1fr))",
          height:
            stage === "oneSmallYear" || stage === "oneFullLife"
              ? "min(95vh, (95vw * 90) / 52)"
              : "calc((100vw - 2rem) / 52)", // Adjusted for padding/margins
          width:
            stage === "oneSmallYear" || stage === "oneFullLife"
              ? "min(95vw, (95vh * 52) / 90)"
              : "calc(100vw - 2rem)",
        }}
      >
        {(stage === "oneBigWeek" ||
          stage === "oneSmallWeek" ||
          stage === "oneFullYear") && (
          <div
            className={cn(
              "aspect-square border-[2px] border-black dark:border-white",
              "transition-all duration-1000",
              "absolute top-0",
              stage === "oneBigWeek" &&
                "left-1/2 transform -translate-x-1/2 w-[8rem]",
              (stage === "oneSmallWeek" || stage === "oneFullYear") &&
                "left-0 transform-none w-[calc((100vw-102px-2rem)/52)]"
            )}
          />
        )}
        {(stage === "oneBigWeek" || stage === "oneSmallWeek") && (
          <div className="h-[calc(100vw/52)]">&nbsp;</div>
        )}
        {stage === "oneFullYear" && (
          <>
            {/* Empty padding cell */}
            <div className="w-[calc(100vw/52)]" />
            {/* 51 additional cells, one for each week of the year */}
            {Array.from({ length: 51 }).map((_, i) => (
              <div
                key={i + 1}
                className={cn(
                  "aspect-square border-[2px] border-black dark:border-white",
                  "animate-in fade-in slide-in-from-top duration-1000 fill-mode-forwards"
                  //   "w-[calc(100vw/52)]"
                )}
                style={{
                  opacity: 0,
                  animation: `enter ${DURATION_OF_WEEK_DROP_IN_ANIMATION}ms ease-out ${(i + 1) * INCREMENT_DURATION_OF_WEEK_DROP_IN_ANIMATION}ms forwards`,
                }}
              />
            ))}
          </>
        )}
        {(stage === "oneSmallYear" || stage === "oneFullLife") &&
          Array.from({ length: 52 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square border-[2px] border-black dark:border-white"
            />
          ))}
        {stage === "oneFullLife" &&
          Array.from({ length: 88 }).map((_, i) =>
            Array.from({ length: 52 }).map((_, j) => (
              <div
                key={`${i}-${j}`}
                className="aspect-square border-[2px] border-black dark:border-white"
                style={{
                  opacity: 0,
                  animation: `enter ${DURATION_OF_YEAR_DROP_IN_ANIMATION}ms ease-out ${(i + 1) * INCREMENT_DURATION_OF_YEAR_DROP_IN_ANIMATION}ms forwards`,
                }}
              />
            ))
          )}
      </div>
    </div>
  );
}
