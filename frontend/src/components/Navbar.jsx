import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { isFirebaseEnabled } from "../services/firebase";
import { mlService } from "../services/mlService";
import { 
  Sun, 
  Moon, 
  Bell, 
  Search, 
  Database, 
  Cpu, 
  CheckCircle,
  AlertTriangle
} from "lucide-react";

export const Navbar = () => {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [mlConnected, setMlConnected] = useState(false);
  const [checkingMl, setCheckingMl] = useState(true);

  // Mock Notifications
  const [notifications, setNotifications] = useState([
    { id: 1, text: "Google recruitment visit finalized. 6 offers issued.", time: "2 hrs ago", read: false },
    { id: 2, text: "Placement probability trained. Logistic Regression pipeline updated.", time: "4 hrs ago", read: false },
    { id: 3, text: "Student records imported successfully via bulk CSV upload.", time: "1 day ago", read: true },
    { id: 4, text: "L&T Tech Services completed recruitment drive.", time: "2 days ago", read: true }
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    // Check ML backend connection status
    const checkMl = async () => {
      setCheckingMl(true);
      const res = await mlService.checkHealth();
      setMlConnected(res.online);
      setCheckingMl(false);
    };
    checkMl();
  }, []);

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === "/") return "Placement Dashboard";
    if (path === "/companies") return "Company Visits";
    if (path === "/students") return "Student Placements";
    if (path === "/analytics") return "Placement Analytics";
    if (path === "/predictions") return "AI Predictions";
    if (path === "/reports") return "Data Reports & Bulk Import";
    if (path === "/settings") return "System Settings";
    return "Campus Placement System";
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-6 border-b border-slate-200/50 dark:border-slate-800/50 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">
          {getPageTitle()}
        </h1>
      </div>

      {/* Right Side Icons */}
      <div className="flex items-center space-x-4">
        {/* ML Status Badge */}
        <div 
          className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
            checkingMl 
              ? "bg-slate-100 border-slate-200 text-slate-500 dark:bg-slate-800 dark:border-slate-700" 
              : mlConnected 
              ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-800 dark:text-emerald-400" 
              : "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/20 dark:border-amber-800 dark:text-amber-400"
          }`}
          title={mlConnected ? "Flask ML Service Connected" : "Flask ML Service Offline (Running Client-side emulation)"}
        >
          <Cpu size={13} className={checkingMl ? "animate-pulse" : ""} />
          <span>{checkingMl ? "ML Sync..." : mlConnected ? "ML Service: Online" : "ML Service: Simulated"}</span>
        </div>

        {/* Firebase / Database Status Badge */}
        <div 
          className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
            isFirebaseEnabled() 
              ? "bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/20 dark:border-indigo-800 dark:text-indigo-400" 
              : "bg-slate-100 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400"
          }`}
          title={isFirebaseEnabled() ? "Firebase Realtime DB Active" : "Mock Database Falling back to localStorage"}
        >
          <Database size={13} />
          <span>{isFirebaseEnabled() ? "Firebase Active" : "Mock DB Fallback"}</span>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg border border-slate-200/50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
          aria-label="Toggle Theme"
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notifications Panel */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg border border-slate-200/50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
            aria-label="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl p-4 slide-in z-50">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 dark:border-slate-800">
                <span className="font-bold text-sm">Notifications</span>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllRead} 
                    className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {notifications.map((item) => (
                  <div 
                    key={item.id} 
                    className={`p-2 rounded-lg text-xs border ${
                      item.read 
                        ? "bg-transparent border-transparent text-slate-500 dark:text-slate-400" 
                        : "bg-slate-50 border-slate-100 dark:bg-slate-800/40 dark:border-slate-800/60 text-slate-800 dark:text-slate-200"
                    }`}
                  >
                    <div className="flex justify-between font-semibold mb-1">
                      <span>System Notification</span>
                      <span className="text-[10px] text-slate-400">{item.time}</span>
                    </div>
                    <p className="line-clamp-2">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
export default Navbar;
