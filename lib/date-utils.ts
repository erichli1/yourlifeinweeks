import * as chrono from "chrono-node";

export function didYearWeekPassRelativeToToday({
  birthday,
  yearWeek,
}: {
  birthday: Date;
  yearWeek: YearWeek;
}): boolean {
  const currentYearWeek = getCurrentYearWeekRelativeToBirthday(birthday);

  return (
    currentYearWeek.year > yearWeek.year ||
    (currentYearWeek.year === yearWeek.year &&
      currentYearWeek.week > yearWeek.week)
  );
}

export type YearWeek = {
  year: number; // 0-indexed
  week: number; // 1-indexed
};

function getMostRecentBirthdayRelativeToDate(birthday: Date, date: Date): Date {
  const mostRecentBirthday = new Date(birthday);
  const birthdayThisYear = new Date(birthday);
  birthdayThisYear.setFullYear(date.getFullYear());

  if (birthdayThisYear.getTime() > date.getTime())
    mostRecentBirthday.setFullYear(date.getFullYear() - 1);
  else mostRecentBirthday.setFullYear(date.getFullYear());

  return mostRecentBirthday;
}

export function getYearWeekOfDate({
  birthday,
  date,
}: {
  birthday: Date;
  date: Date;
}): YearWeek {
  const mostRecentBirthday = getMostRecentBirthdayRelativeToDate(
    birthday,
    date
  );

  let yearsOld = date.getFullYear() - birthday.getFullYear();
  if (date.getFullYear() === mostRecentBirthday.getFullYear()) yearsOld += 1;

  // Since the most recent birthday, calculate the number of weeks passed.
  // If in the extra few days of the new year, it's possible to have 52 weeks passed so
  // we limit it to 51.
  const numWeeksSinceMostRecentBirthday = Math.min(
    Math.floor(
      (date.getTime() - mostRecentBirthday.getTime()) /
        (7 * 24 * 60 * 60 * 1000)
    ),
    51
  );

  return {
    year: yearsOld - 1,
    week: numWeeksSinceMostRecentBirthday + 1,
  };
}

export function getCurrentYearWeekRelativeToBirthday(birthday: Date): YearWeek {
  return getYearWeekOfDate({ birthday, date: new Date() });
}

export function addOrdinalSuffix(val: number): string {
  const suffixes = ["th", "st", "nd", "rd"];
  const remainder = val % 100;

  return (
    val +
    (suffixes[(remainder - 20) % 10] || suffixes[remainder] || suffixes[0])
  );
}

export function getDatesFromWeekNumber({
  birthday,
  yearWeek,
}: {
  birthday: Date;
  yearWeek: YearWeek;
}): {
  start: Date;
  end: Date;
} {
  const startOfWeek = new Date(birthday);
  startOfWeek.setFullYear(birthday.getFullYear() + yearWeek.year);
  startOfWeek.setDate(startOfWeek.getDate() + (yearWeek.week - 1) * 7);

  // The last week is a little longer to account for the extra 2-3 days (52 * 7 = 364)
  const endOfWeek = new Date(startOfWeek);
  if (yearWeek.week === 52) {
    // For week 52, end at the day before next birthday in that year
    const nextBirthday = new Date(birthday);
    nextBirthday.setFullYear(birthday.getFullYear() + yearWeek.year + 1);
    endOfWeek.setTime(nextBirthday.getTime() - 24 * 60 * 60 * 1000); // Day before next birthday
  } else {
    endOfWeek.setDate(endOfWeek.getDate() + 6);
  }

  return { start: startOfWeek, end: endOfWeek };
}

export function renderDate(
  date: Date,
  format: "MM/DD/YY" | "MM/DD" | "MM/DD/YY HH:MM" | "MMM DD YYYY"
) {
  if (format === "MM/DD/YY")
    return date.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "2-digit",
    });

  if (format === "MM/DD")
    return date.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
    });

  if (format === "MM/DD/YY HH:MM")
    return date.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

  if (format === "MMM DD YYYY")
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  return date.toLocaleDateString();
}

export const parseDateTime = (str: Date | string) => {
  if (str instanceof Date) return str;
  return chrono.parseDate(str);
};

export const isValidYearWeek = (yearWeek: YearWeek): boolean => {
  return (
    yearWeek.year >= 0 &&
    yearWeek.year <= 89 &&
    yearWeek.week >= 1 &&
    yearWeek.week <= 52
  );
};
