import { cn } from "@/lib/utils";
import React from "react";

const DELAY_TO_MINIMIZE_ONE_WEEK = 2000;
const DELAY_TO_SHOW_REST_OF_YEAR = 4000;
const DURATION_OF_WEEK_DROP_IN_ANIMATION = 500;
const INCREMENT_DURATION_OF_WEEK_DROP_IN_ANIMATION = 50;

export function Onboarding() {
  const [stage, setStage] = React.useState<
    "oneBigWeek" | "oneSmallWeek" | "oneFullYear"
  >("oneBigWeek");

  React.useEffect(() => {
    const smallTimer = setTimeout(() => {
      setStage("oneSmallWeek");
    }, DELAY_TO_MINIMIZE_ONE_WEEK);

    const restOfYearTimer = setTimeout(() => {
      setStage("oneFullYear");
    }, DELAY_TO_SHOW_REST_OF_YEAR);

    return () => {
      clearTimeout(smallTimer);
      clearTimeout(restOfYearTimer);
    };
  }, []);

  //   return (
  //     <div className="h-screen overflow-auto flex">
  //       <div
  //         className="mx-auto my-auto grid gap-[2px]"
  //         style={{
  //           aspectRatio: "52/90",
  //           gridTemplateColumns: "repeat(52, minmax(0, 1fr))",
  //           gridTemplateRows: "repeat(90, minmax(0, 1fr))",
  //           height: "min(95vh, 95vw * 90/52)",
  //           width: "min(95vw, 95vh * 52/90)",
  //         }}
  //       >
  //         {Array.from({ length: 90 }).map((_, year) => (
  //           <React.Fragment key={`year-${year}`}>
  //             {Array.from({ length: 52 }).map((_, week) => (
  //               <div
  //                 key={`cell-${year}-${week}`}
  //                 className="aspect-square border-[1px] border-black dark:border-white"
  //               />
  //             ))}
  //           </React.Fragment>
  //         ))}
  //       </div>
  //     </div>
  //   );

  return (
    <div className="h-screen flex items-center justify-center flex-col gap-4 animate-in fade-in duration-500 p-4">
      {stage === "oneBigWeek" && <div>This is one week of your life.</div>}
      {stage === "oneSmallWeek" && <div>&nbsp;</div>}
      {stage === "oneFullYear" && (
        <div className="animate-in fade-in duration-500">
          This is one year of your life.
        </div>
      )}

      <div
        className="relative grid gap-[2px] w-full"
        style={{
          gridTemplateColumns: "repeat(52, minmax(0, 1fr))",
        }}
      >
        <div
          className={cn(
            "aspect-square border-[2px] border-black dark:border-white",
            "transition-all duration-1000",
            "absolute top-0",
            stage === "oneSmallWeek" || stage === "oneFullYear"
              ? "left-0 transform-none w-[calc(100vw/52)]"
              : "left-1/2 transform -translate-x-1/2 w-[8rem]"
          )}
        />
        {stage === "oneFullYear" ? (
          <>
            {/* Empty padding cell */}
            <div className="w-[calc(100vw/52)]" />
            {/* 51 additional cells, one for each week of the year */}
            {Array.from({ length: 51 }).map((_, i) => (
              <div
                key={i + 1}
                className={cn(
                  "aspect-square border-[2px] border-black dark:border-white",
                  "animate-in fade-in slide-in-from-top duration-1000 fill-mode-forwards",
                  "w-[calc(100vw/52)]"
                )}
                style={{
                  opacity: 0,
                  animation: `enter ${DURATION_OF_WEEK_DROP_IN_ANIMATION}ms ease-out ${(i + 1) * INCREMENT_DURATION_OF_WEEK_DROP_IN_ANIMATION}ms forwards`,
                }}
              />
            ))}
          </>
        ) : (
          <div className="h-[calc(100vw/52)]">&nbsp;</div>
        )}
      </div>
    </div>
  );
}
