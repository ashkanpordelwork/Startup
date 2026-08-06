import { Sparkles } from "reicon-react";
import { Navigate, Route, Routes } from "react-router-dom";
import { HashRouter } from "react-router-dom";
import Layout from "./components/Layout";
import ActionDetail from "./pages/ActionDetail";
import Chat from "./pages/Chat";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Notifications from "./pages/Notifications";
import PlanDetail from "./pages/PlanDetail";
import Profile from "./pages/Profile";
import { AuthProvider, useAuth } from "./auth/AuthContext";

function LoadingScreen() {
  return (
    <div className="flex h-screen items-center justify-center bg-muted">
      <span className="flex h-14 w-14 animate-pulse items-center justify-center rounded-full bg-secondary text-brand">
        <Sparkles size={26} />
      </span>
    </div>
  );
}

function Gate() {
  const { status, user } = useAuth();

  if (status === "loading") {
    return <LoadingScreen />;
  }

  if (status === "anon") {
    return <Login />;
  }

  if (!user?.name) {
    return <Login initialStep="name" />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/plans/:id" element={<PlanDetail />} />
        <Route path="/actions/:id" element={<ActionDetail />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <Gate />
      </AuthProvider>
    </HashRouter>
  );
}
