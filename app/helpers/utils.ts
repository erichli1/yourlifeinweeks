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
  year: number;
  week: number;
};

export function getCurrentYearWeekRelativeToBirthday(birthday: Date): YearWeek {
  const endOfBirthdayWeek = new Date(birthday);
  endOfBirthdayWeek.setDate(birthday.getDate() - birthday.getDay() + 6);
  endOfBirthdayWeek.setHours(23, 59, 59, 999);

  const endOfCurrentWeek = new Date();
  endOfCurrentWeek.setDate(
    endOfCurrentWeek.getDate() - endOfCurrentWeek.getDay() + 6
  );
  endOfCurrentWeek.setHours(23, 59, 59, 999);

  const mostRecentBirthday = new Date(endOfBirthdayWeek);
  if (mostRecentBirthday.getFullYear() < endOfCurrentWeek.getFullYear())
    mostRecentBirthday.setFullYear(endOfCurrentWeek.getFullYear() - 1);

  const numYearsSinceBirthday =
    endOfCurrentWeek.getFullYear() - endOfBirthdayWeek.getFullYear();

  const numWeeksSinceMostRecentBirthday = Math.floor(
    (endOfCurrentWeek.getTime() - mostRecentBirthday.getTime()) /
      (7 * 24 * 60 * 60 * 1000)
  );

  return {
    year: numYearsSinceBirthday - 1,
    week: numWeeksSinceMostRecentBirthday,
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
  // Find the start of the week (Sunday) before the birthday
  const endOfBirthdayWeek = new Date(birthday);
  endOfBirthdayWeek.setDate(birthday.getDate() - birthday.getDay() + 6);
  endOfBirthdayWeek.setHours(23, 59, 59, 999);

  // Get the offset from end of birthday week to given year and week
  const endOfGivenWeek = new Date(endOfBirthdayWeek);
  endOfGivenWeek.setFullYear(endOfBirthdayWeek.getFullYear() + yearWeek.year);
  endOfGivenWeek.setDate(endOfBirthdayWeek.getDate() + yearWeek.week * 7);

  const startOfGivenWeek = new Date(endOfGivenWeek);
  startOfGivenWeek.setDate(endOfGivenWeek.getDate() - 6);

  return { start: startOfGivenWeek, end: endOfGivenWeek };
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
