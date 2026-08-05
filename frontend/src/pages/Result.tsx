import { Link, useLocation, useNavigate } from "react-router-dom";
import { IntakeResult } from "../api/types";

const TRACK_LABELS: Record<string, string> = {
  TRACK_0_RED_FLAG: "مسیر احتیاط (نیاز به هماهنگی با پزشک)",
  TRACK_1_SLEEP_STRESS: "مسیر خواب و استرس",
  TRACK_2_DIET_HISTORY: "مسیر پایدارسازی عادت غذایی",
  TRACK_3_MOBILITY: "مسیر کم‌ضربه",
  TRACK_4_BASELINE: "مسیر پایه‌ی استاندارد",
};

export default function Result() {
  const location = useLocation();
  const navigate = useNavigate();
  const result = location.state as IntakeResult | null;

  if (!result) {
    return (
      <div className="card">
        <p>هنوز پرسش‌نامه‌ای تکمیل نکرده‌اید.</p>
        <Link to="/">رفتن به پرسش‌نامه</Link>
      </div>
    );
  }

  return (
    <div className="card">
      <span className="track-badge">{TRACK_LABELS[result.track] ?? result.track}</span>
      <div className="chat-bubble">{result.message}</div>
      <div className="nav-buttons">
        <button className="secondary" onClick={() => navigate("/")}>
          تکمیل مجدد پرسش‌نامه
        </button>
        <button className="primary" onClick={() => navigate("/dashboard")}>
          رفتن به پیگیری روزانه
        </button>
      </div>
    </div>
  );
}
