import { Sparkles } from "reicon-react";
import { Navigate, Route, Routes } from "react-router-dom";
import { HashRouter } from "react-router-dom";
import Layout from "./components/Layout";
import Chat from "./pages/Chat";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import { AuthProvider, useAuth } from "./auth/AuthContext";

function LoadingScreen() {
  return (
    <div className="flex h-screen items-center justify-center bg-muted">
      <span className="flex h-14 w-14 animate-pulse items-center justify-center rounded-full bg-secondary text-primary">
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
        <Route path="/" element={<Chat />} />
        <Route path="/dashboard" element={<Dashboard />} />
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
