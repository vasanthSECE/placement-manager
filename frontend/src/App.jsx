import React, { useState } from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";

// Pages
import Dashboard from "./pages/Dashboard";
import Companies from "./pages/Companies";
import Students from "./pages/Students";
import Analytics from "./pages/Analytics";
import MLPredictions from "./pages/MLPredictions";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import MockInterview from "./pages/MockInterview";

// Protected Route Guard
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="w-10 h-10 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Admin Route Guard
const AdminRoute = ({ children }) => {
  const { user } = useAuth();
  if (user?.role !== "admin") {
    return <Navigate to="/" replace />;
  }
  return children;
};

// Student Route Guard
const StudentRoute = ({ children }) => {
  const { user } = useAuth();
  if (user?.role !== "student") {
    return <Navigate to="/" replace />;
  }
  return children;
};

// Main Layout Wrapper
const MainAppLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300 flex">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 min-h-screen transition-all duration-300 flex flex-col ${isCollapsed ? "pl-20" : "pl-64"}`}>
        <Navbar />
        <main className="p-6 flex-1 max-w-[1600px] mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      {/* Protected dashboard modules */}
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <MainAppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="companies" element={<AdminRoute><Companies /></AdminRoute>} />
        <Route path="students" element={<AdminRoute><Students /></AdminRoute>} />
        <Route path="analytics" element={<AdminRoute><Analytics /></AdminRoute>} />
        <Route path="predictions" element={<MLPredictions />} />
        <Route path="interview" element={<StudentRoute><MockInterview /></StudentRoute>} />
        <Route path="reports" element={<AdminRoute><Reports /></AdminRoute>} />
        <Route path="settings" element={<AdminRoute><Settings /></AdminRoute>} />
      </Route>

      {/* Redirects */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
