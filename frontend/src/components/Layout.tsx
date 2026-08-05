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
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b bg-card px-4 py-3 sm:px-6">
        <span className="text-base font-bold sm:text-lg">دستیار سبک زندگی</span>
        <nav className="flex flex-wrap items-center gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
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
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}
