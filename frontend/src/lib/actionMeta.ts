import { ChefHat, Dumbbell, Leaf, Moon } from "reicon-react";
import { ActionCategory, ActionStatus } from "../api/types";

export const CATEGORY_META: Record<ActionCategory, { label: string; icon: typeof ChefHat; chipClassName: string }> = {
  diet: { label: "تغذیه", icon: ChefHat, chipClassName: "bg-orange-100 text-orange-600" },
  activity: { label: "فعالیت بدنی", icon: Dumbbell, chipClassName: "bg-emerald-100 text-emerald-600" },
  sleep: { label: "خواب", icon: Moon, chipClassName: "bg-indigo-100 text-indigo-600" },
  lifestyle: { label: "سبک زندگی", icon: Leaf, chipClassName: "bg-teal-100 text-teal-600" },
};

export const STATUS_META: Record<ActionStatus, { label: string; className: string; textClassName: string }> = {
  in_progress: { label: "در حال انجام", className: "bg-muted text-muted-foreground", textClassName: "text-helper-foreground" },
  needs_review: { label: "نیاز به بازبینی", className: "bg-amber-100 text-amber-700", textClassName: "text-amber-600" },
  done: { label: "تمام‌شده", className: "bg-emerald-100 text-emerald-700", textClassName: "text-emerald-600" },
};
