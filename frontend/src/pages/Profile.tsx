import { User } from "reicon-react";
import { useAuth } from "../auth/AuthContext";

export default function Profile() {
  const { user } = useAuth();

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary text-brand">
        <User size={28} />
      </span>
      {user?.name && <p className="text-lg font-semibold">{user.name}</p>}
      <p className="text-base leading-relaxed text-helper-foreground">صفحه‌ی پروفایل به‌زودی فعال می‌شه.</p>
    </div>
  );
}
