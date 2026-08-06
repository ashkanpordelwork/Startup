import { ChefHat, Dumbbell, Leaf, Moon } from "reicon-react";
import { ActionCategory, ActionStatus } from "../api/types";

export const CATEGORY_META: Record<ActionCategory, { label: string; icon: typeof ChefHat }> = {
  diet: { label: "تغذیه", icon: ChefHat },
  activity: { label: "فعالیت بدنی", icon: Dumbbell },
  sleep: { label: "خواب", icon: Moon },
  lifestyle: { label: "سبک زندگی", icon: Leaf },
};

export const STATUS_META: Record<ActionStatus, { label: string; className: string }> = {
  in_progress: { label: "در حال انجام", className: "bg-secondary text-primary" },
  needs_review: { label: "نیاز به بازبینی", className: "bg-destructive/10 text-destructive" },
  done: { label: "تمام‌شده", className: "bg-primary text-primary-foreground" },
};
