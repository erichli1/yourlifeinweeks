import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import React, { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { DatePicker, isValidDate } from "./DatePicker";

export function CreateAccountFlow({
  onSubmit,
  className,
  copy,
  hideButtonIfNotValid = true,
}: {
  onSubmit: (name: string, birthday: number) => void;
  className?: string;
  copy?: Partial<{
    name: string;
    birthday: string;
    button: string;
  }>;
  hideButtonIfNotValid?: boolean;
}) {
  const [birthday, setBirthday] = useState<string>("");
  const [name, setName] = useState<string>("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const birthdayParam = params.get("birthday");
    if (birthdayParam && isValidDate(birthdayParam)) setBirthday(birthdayParam);
  }, []);

  const canSubmit = isValidDate(birthday) && name.length > 0;

  const handleSubmit = () =>
    onSubmit(name, new Date(birthday + "T00:00:00").getTime());

  const actualCopy = {
    name: "What's your name?",
    birthday: "What's your birthday?",
    button: "All done",
    ...copy,
  };

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="grid w-full max-w-sm gap-1.5">
        <Label htmlFor="name">{actualCopy.name}</Label>
        <Input
          type="text"
          id="name"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="grid w-full max-w-sm items-center gap-1.5">
        <Label htmlFor="birthday">{actualCopy.birthday}</Label>
        <DatePicker date={birthday} setDate={setBirthday} />
      </div>

      {!hideButtonIfNotValid || canSubmit ? (
        <div className="w-full max-w-sm">
          <Button
            onClick={handleSubmit}
            disabled={!hideButtonIfNotValid && !canSubmit}
          >
            {actualCopy.button}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
