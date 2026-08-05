import { Navigate, Route, Routes } from "react-router-dom";
import { HashRouter } from "react-router-dom";
import Layout from "./components/Layout";
import Admin from "./pages/Admin";
import Dashboard from "./pages/Dashboard";
import Intake from "./pages/Intake";
import IntentChat from "./pages/IntentChat";
import Result from "./pages/Result";

export default function App() {
  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<IntentChat />} />
          <Route path="/intake" element={<Intake />} />
          <Route path="/result" element={<Result />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
}
