export const StageList = [
  "oneBigWeek",
  "oneSmallWeek",
  "oneFullYear",
  "oneSmallYear",
  "oneFullLife",
] as const;

export type Stage = (typeof StageList)[number];

export type View = "1x52" | "90x52";

export const ViewMap: Record<Stage, View> = {
  oneBigWeek: "1x52",
  oneSmallWeek: "1x52",
  oneFullYear: "1x52",
  oneSmallYear: "90x52",
  oneFullLife: "90x52",
};

export const DelayMap: Record<Stage, number> = {
  oneBigWeek: 0,
  oneSmallWeek: 2000,
  oneFullYear: 4000,
  oneSmallYear: 8000,
  oneFullLife: 9000,
};

export const TitleMap: Record<Stage, string | null> = {
  oneBigWeek: "This is one week of your life.",
  oneSmallWeek: null,
  oneFullYear: "This is one year of your life.",
  oneSmallYear: null,
  oneFullLife: "This is your life.",
};

export function didWeekPass({
  birthday,
  today,
  year,
  week,
}: {
  birthday: Date;
  today: Date;
  year: number;
  week: number;
}) {
  // Find the start of the week (Sunday) before the birthday
  const endOfBirthdayWeek = new Date(birthday);
  endOfBirthdayWeek.setDate(birthday.getDate() - birthday.getDay() + 6);
  endOfBirthdayWeek.setHours(23, 59, 59, 999);

  // Get the offset from end of birthday week to given year and week
  const endOfGivenWeek = new Date(endOfBirthdayWeek);
  endOfGivenWeek.setFullYear(endOfBirthdayWeek.getFullYear() + year);
  endOfGivenWeek.setDate(endOfBirthdayWeek.getDate() + week * 7);

  return endOfGivenWeek < today;
}
