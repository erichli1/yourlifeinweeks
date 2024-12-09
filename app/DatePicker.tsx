import { Input } from "@/components/ui/input";

const MIN_BIRTHDAY_DATE = new Date("1940-01-01");

export const isValidDate = (dateStr: string) => {
  const parsedDate = Date.parse(dateStr);

  return (
    parsedDate >= MIN_BIRTHDAY_DATE.getTime() &&
    parsedDate <= new Date().getTime()
  );
};

export function DatePicker({
  date,
  setDate,
  onEnter,
}: {
  date: string;
  setDate: (date: string) => void;
  onEnter?: () => void;
}) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onEnter && e.key === "Enter" && isValidDate(date)) onEnter();
  };

  return (
    <Input
      type="date"
      placeholder="Date"
      className="w-fit cursor-text"
      value={date}
      onChange={(e) => setDate(e.target.value)}
      onKeyDown={handleKeyDown}
    />
  );
}
