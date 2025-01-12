import { Input, InputProps } from "@/components/ui/input";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getYearWeekOfDate,
  isValidYearWeek,
  parseDateTime,
  YearWeek,
} from "./date-utils";
import { debounce } from "lodash";

export default function YearWeekInput({
  birthday,
  setValues,
  props,
}: {
  birthday: Date;
  setValues: (
    yearWeek: YearWeek | null | undefined,
    date: Date | null | undefined
  ) => void;
  props?: InputProps;
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

  // Update the setYearWeek function
  useEffect(() => {
    setValues(processedYearWeek, processedDate);
  }, [processedYearWeek, processedDate, setValues]);

  return (
    <Input
      value={dateString}
      onChange={(e) => {
        setDateString(e.target.value);
        if (e.target.value === "") setProcessedDate(undefined);
        else debouncedUpdateProcessedDate(e.target.value);
      }}
      {...props}
    />
  );
}
