import { PropsWithChildren } from "react";
import { NavLink } from "react-router-dom";

import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", label: "پرسش‌نامه", end: true },
  { to: "/dashboard", label: "پیگیری روزانه", end: false },
  { to: "/admin", label: "پنل ادمین", end: false },
];

export default function Layout({ children }: PropsWithChildren) {
  return (
    <div className="flex min-h-screen justify-center bg-muted/40">
      <div className="flex w-full max-w-[420px] min-w-0 flex-col bg-background">
        <header className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b bg-card px-4 py-2.5">
          <span className="text-sm font-bold">دستیار سبک زندگی</span>
          <nav className="flex flex-wrap items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </header>
        <main className="flex flex-1 flex-col px-4 py-4">{children}</main>
      </div>
    </div>
  );
}
