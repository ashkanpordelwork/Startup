import { Bell } from "reicon-react";

export default function Notifications() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary text-brand">
        <Bell size={28} />
      </span>
      <p className="text-sm leading-relaxed text-helper-foreground">
        بخش نوتیفیکیشن‌ها به‌زودی فعال می‌شه.
      </p>
    </div>
  );
}
