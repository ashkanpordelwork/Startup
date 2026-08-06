import { PropsWithChildren } from "react";
import { ArrowRight, Bell, Home as HomeIcon, User } from "reicon-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";

import { cn } from "@/lib/utils";

const tabs = [
  { to: "/", label: "صفحه اصلی", icon: HomeIcon, match: (p: string) => p === "/" || p.startsWith("/plans") || p.startsWith("/actions") || p === "/chat" },
  { to: "/notifications", label: "نوتیفیکیشن", icon: Bell, match: (p: string) => p.startsWith("/notifications") },
  { to: "/profile", label: "پروفایل", icon: User, match: (p: string) => p.startsWith("/profile") },
];

const HEADER_TITLES: { match: (p: string) => boolean; title: string }[] = [
  { match: (p) => p === "/", title: "صفحه اصلی" },
  { match: (p) => p === "/chat", title: "چت‌بات" },
  { match: (p) => p.startsWith("/plans"), title: "جزئیات برنامه" },
  { match: (p) => p.startsWith("/actions"), title: "جزئیات اقدام" },
  { match: (p) => p.startsWith("/notifications"), title: "نوتیفیکیشن" },
  { match: (p) => p.startsWith("/profile"), title: "پروفایل" },
];

const ROOT_PATHS = ["/", "/notifications", "/profile"];

function BottomNav() {
  const location = useLocation();
  return (
    <nav className="flex items-center justify-around bg-background px-2 pb-3 pt-2">
      {tabs.map((tab) => {
        const isActive = tab.match(location.pathname);
        const Icon = tab.icon;
        return (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={cn(
              "flex flex-col items-center gap-1.5 px-4 py-2 transition-[color,transform] duration-200 active:scale-90",
              isActive ? "scale-105 text-brand" : "scale-100 text-muted-foreground opacity-70"
            )}
          >
            <Icon size={22} weight={isActive ? "Filled" : undefined} className={isActive ? "animate-pop-in" : undefined} />
            <span className="text-xs font-semibold">{tab.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}

export default function Layout({ children }: PropsWithChildren) {
  const location = useLocation();
  const navigate = useNavigate();
  const title = HEADER_TITLES.find((h) => h.match(location.pathname))?.title ?? "";
  const showBack = !ROOT_PATHS.includes(location.pathname);

  return (
    <div className="flex h-screen justify-center bg-muted">
      <div className="flex h-full w-full max-w-[420px] min-w-0 flex-col bg-background">
        <header className="grid grid-cols-[1fr_auto_1fr] items-center bg-background px-5 py-4">
          <span>
            {showBack && (
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-foreground transition-[background-color,transform] duration-150 hover:bg-muted active:scale-90"
              >
                <ArrowRight size={20} />
              </button>
            )}
          </span>
          <h1 className="text-center text-xl font-semibold">{title}</h1>
          <span />
        </header>
        <main key={location.pathname} className="flex min-h-0 flex-1 animate-fade-in-up flex-col overflow-hidden">
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
