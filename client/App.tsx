import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import Report from "./pages/Report";
import AdminDashboard from "./pages/AdminDashboard";
import History from "./pages/History";
import MyHistory from "./pages/MyHistory";
import Marketplace from "./pages/Marketplace";
import Workers from "@/pages/Workers";
import DeptAdmins from "@/pages/DeptAdmins";
import MunicipalWorkers from "@/pages/MunicipalWorkers";
import { AuthProvider, useAuth } from "@/context/AuthContext";

const queryClient = new QueryClient();

function RequireAuth({ children }: { children: JSX.Element }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  return children;
}

function RequireCitizen({ children }: { children: JSX.Element }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  if (user.role !== "citizen") return <Navigate to="/" replace />;
  return children;
}

function RequireAdmin({ children }: { children: JSX.Element }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  if (user.role !== "admin") return <Navigate to="/" replace />;
  return children;
}

function RequireDeptAdminNonMunicipal({ children }: { children: JSX.Element }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  if (user.role !== "admin") return <Navigate to="/" replace />;
  if (user.department === "Municipal") return <Navigate to="/admin" replace />;
  return children;
}

function RequireMunicipal({ children }: { children: JSX.Element }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  if (user.role !== "admin") return <Navigate to="/" replace />;
  if (user.department !== "Municipal") return <Navigate to="/" replace />;
  return children;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/dashboard" element={<RequireCitizen><Dashboard /></RequireCitizen>} />
            <Route path="/admin" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
            <Route path="/history" element={<RequireAdmin><History /></RequireAdmin>} />
            <Route path="/workers" element={<RequireDeptAdminNonMunicipal><Workers /></RequireDeptAdminNonMunicipal>} />
            <Route path="/dept-admins" element={<RequireMunicipal><DeptAdmins /></RequireMunicipal>} />
            <Route path="/municipal-workers" element={<RequireMunicipal><MunicipalWorkers /></RequireMunicipal>} />
            <Route path="/my-history" element={<RequireCitizen><MyHistory /></RequireCitizen>} />
            <Route path="/marketplace" element={<RequireCitizen><Marketplace /></RequireCitizen>} />
            <Route path="/report" element={<RequireCitizen><Report /></RequireCitizen>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
