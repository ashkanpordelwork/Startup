import { PropsWithChildren } from "react";
import { ChatRoundDots, ClipboardCheck, ShieldCheck, Sparkles } from "reicon-react";
import { NavLink, useLocation } from "react-router-dom";

import { cn } from "@/lib/utils";

const tabs = [
  { to: "/dashboard", label: "پیگیری روزانه", icon: ClipboardCheck, end: false },
  { to: "/", label: "چت‌بات", icon: Sparkles, end: true, isMain: true },
  { to: "/admin", label: "پنل ادمین", icon: ShieldCheck, end: false },
];

function BottomNav() {
  const location = useLocation();
  return (
    <nav className="flex items-end justify-around border-t bg-background px-2 pb-2 pt-1.5">
      {tabs.map((tab) => {
        const isActive = tab.end ? location.pathname === tab.to : location.pathname.startsWith(tab.to);
        const Icon = tab.icon;

        if (tab.isMain) {
          return (
            <NavLink key={tab.to} to={tab.to} className="flex flex-col items-center gap-1">
              <span
                className={cn(
                  "-mt-5 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-chat transition-transform",
                  isActive && "scale-105"
                )}
              >
                <Icon size={22} weight="Filled" />
              </span>
              <span className={cn("text-[10px] font-semibold", isActive ? "text-primary" : "text-muted-foreground")}>
                {tab.label}
              </span>
            </NavLink>
          );
        }

        return (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={cn(
              "flex flex-col items-center gap-1 px-3 py-1.5",
              isActive ? "text-primary" : "text-muted-foreground opacity-70"
            )}
          >
            <Icon size={20} />
            <span className="text-[10px] font-semibold">{tab.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}

export default function Layout({ children }: PropsWithChildren) {
  return (
    <div className="flex h-screen justify-center bg-muted">
      <div className="flex h-full w-full max-w-[420px] min-w-0 flex-col bg-background">
        <header className="grid grid-cols-[1fr_auto_1fr] items-center border-b bg-background px-4 py-3">
          <span />
          <h1 className="text-center text-xl font-semibold">چت‌بات</h1>
          <span className="flex justify-end text-primary">
            <ChatRoundDots size={22} />
          </span>
        </header>
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</main>
        <BottomNav />
      </div>
    </div>
  );
}
