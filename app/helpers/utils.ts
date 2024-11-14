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

function getMostRecentBirthday(birthday: Date): Date {
  const today = new Date();

  const mostRecentBirthday = new Date(birthday);
  if (mostRecentBirthday.getFullYear() < today.getFullYear())
    mostRecentBirthday.setFullYear(birthday.getFullYear() - 1);

  return mostRecentBirthday;
}

export function getCurrentYearWeekRelativeToBirthday(birthday: Date): YearWeek {
  const today = new Date();

  const mostRecentBirthday = getMostRecentBirthday(birthday);

  const numYearsSinceBirthday = today.getFullYear() - birthday.getFullYear();

  // Since the most recent birthday, calculate the number of weeks passed.
  // If in the extra few days of the new year, it's possible to have 52 weeks passed so
  // we limit it to 51.
  const numWeeksSinceMostRecentBirthday = Math.min(
    Math.floor(
      (today.getTime() - mostRecentBirthday.getTime()) /
        (7 * 24 * 60 * 60 * 1000)
    ),
    51
  );

  return {
    year: numYearsSinceBirthday - 1,
    week: numWeeksSinceMostRecentBirthday + 1,
  };
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
    const mostRecentBirthday = getMostRecentBirthday(birthday);
    endOfWeek.setFullYear(mostRecentBirthday.getFullYear() + 1);
    endOfWeek.setDate(mostRecentBirthday.getDate() - 1);
  } else {
    endOfWeek.setDate(endOfWeek.getDate() + 6);
  }

  return { start: startOfWeek, end: endOfWeek };
}

export function renderDate(date: Date, format: "MM/DD/YY") {
  if (format === "MM/DD/YY")
    return date.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "2-digit",
    });

  return date.toLocaleDateString();
}
