import { PropsWithChildren } from "react";
import { NavLink } from "react-router-dom";

export default function Layout({ children }: PropsWithChildren) {
  return (
    <div className="app-shell">
      <header className="app-header">
        <span className="app-title">دستیار سبک زندگی</span>
        <nav>
          <NavLink to="/" end>
            پرسش‌نامه
          </NavLink>
          <NavLink to="/dashboard">پیگیری روزانه</NavLink>
          <NavLink to="/admin">پنل ادمین</NavLink>
        </nav>
      </header>
      <main className="app-main">{children}</main>
    </div>
  );
}
