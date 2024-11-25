import { Color } from "@/convex/utils";
import { cn } from "@/lib/utils";

const WEEK_BOX_CUSTOM_COLORS: Record<Color, string> = {
  red: "bg-[#f94144] text-white",
  coral: "bg-[#f9844a] text-white",
  saffron: "bg-[#f9c74f] text-black",
  pistachio: "bg-[#90be6d] text-white",
  zomp: "bg-[#43aa8b] text-white",
  cerulean: "bg-[#277da1] text-white",
};

const WEEK_BOX_CUSTOM_COLORS_HOVER: Record<Color, string> = {
  red: "hover:bg-[#DA070A]",
  coral: "hover:bg-[#F85E12]",
  saffron: "hover:bg-[#ECA809]",
  pistachio: "hover:bg-[#74A94C]",
  zomp: "hover:bg-[#34836C]",
  cerulean: "hover:bg-[#206683]",
};

export const getWeekBoxCustomColor = (color: Color, hover = false) =>
  cn(
    WEEK_BOX_CUSTOM_COLORS[color],
    hover && WEEK_BOX_CUSTOM_COLORS_HOVER[color]
  );

// f94144
// f3722c
// f8961e
// f9844a
// f9c74f
// 90be6d
// 43aa8b
// 4d908e
// 577590
// 277da1
