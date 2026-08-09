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

/**
 * Floating pill tab bar with strong glass blur — pattern taken from the
 * liquid-glass and fintech references the user provided (not the earlier,
 * flatter "glass-bar" style). Margin on all sides so it visibly floats above
 * the gradient background rather than sitting flush against the screen edges.
 */
function BottomNav() {
  const location = useLocation();
  return (
    <nav
      className="glass-bar mx-4 mb-3 flex items-center justify-around px-2 py-2.5"
      style={{ borderRadius: "var(--radius-pill)", backdropFilter: "blur(28px) saturate(200%)" }}
    >
      {tabs.map((tab) => {
        const isActive = tab.match(location.pathname);
        const Icon = tab.icon;
        return (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={cn(
              "flex flex-col items-center gap-1 rounded-full px-5 py-1.5 transition-[color,transform] duration-200 active:scale-90",
              isActive ? "scale-105 text-brand" : "scale-100 text-muted-foreground opacity-60"
            )}
          >
            <Icon size={21} weight={isActive ? "Filled" : undefined} className={isActive ? "animate-pop-in" : undefined} />
            <span className="text-[11px] font-semibold">{tab.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}

/** Floating white circular icon buttons — pattern from the fintech reference top bar. */
function CircleIconButton({ onClick, children }: PropsWithChildren<{ onClick?: () => void }>) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-10 w-10 items-center justify-center rounded-full bg-card text-foreground shadow-chat transition-transform duration-150 active:scale-90"
    >
      {children}
    </button>
  );
}

export default function Layout({ children }: PropsWithChildren) {
  const location = useLocation();
  const navigate = useNavigate();
  const title = HEADER_TITLES.find((h) => h.match(location.pathname))?.title ?? "";
  const showBack = !ROOT_PATHS.includes(location.pathname);

  return (
    <div className="flex h-screen justify-center bg-muted">
      <div className="bg-app-gradient flex h-full w-full max-w-[420px] min-w-0 flex-col">
        <header className="grid grid-cols-[1fr_auto_1fr] items-center px-5 py-4">
          <span>{showBack && <CircleIconButton onClick={() => navigate(-1)}><ArrowRight size={18} /></CircleIconButton>}</span>
          <h1 className="text-center text-base font-bold text-foreground">{title}</h1>
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
