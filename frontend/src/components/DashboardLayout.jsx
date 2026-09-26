// ──────────────────────────────────────────────────────────
// src/components/DashboardLayout.jsx — Authenticated layout shell
// ──────────────────────────────────────────────────────────

import { useState } from "react";
import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import DemoFlowGuide from "./DemoFlowGuide";
import "./DashboardLayout.css";

export default function DashboardLayout() {
  const { isAuthenticated, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <div className="dashboard-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Navbar onMenuToggle={() => setSidebarOpen((v) => !v)} />
      <main className="dashboard-main">
        <Outlet />
      </main>
      <DemoFlowGuide />
    </div>
  );
}
