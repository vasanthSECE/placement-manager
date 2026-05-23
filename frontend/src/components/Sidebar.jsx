import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  LayoutDashboard, 
  Briefcase, 
  Users, 
  BarChart3, 
  Brain, 
  FileText, 
  Settings, 
  LogOut, 
  ChevronLeft, 
  ChevronRight, 
  GraduationCap 
} from "lucide-react";

export const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
  const [localCollapsed, setLocalCollapsed] = useState(false);
  const collapsed = isCollapsed !== undefined ? isCollapsed : localCollapsed;
  const toggleCollapse = setIsCollapsed ? () => setIsCollapsed(!isCollapsed) : () => setLocalCollapsed(!localCollapsed);
  
  const { user, logout } = useAuth();
  const location = useLocation();

  const menuItems = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard },
    { name: "Companies", path: "/companies", icon: Briefcase },
    { name: "Students", path: "/students", icon: Users },
    { name: "Analytics", path: "/analytics", icon: BarChart3 },
    { name: "ML Predictions", path: "/predictions", icon: Brain },
    { name: "Reports", path: "/reports", icon: FileText },
    { name: "Settings", path: "/settings", icon: Settings }
  ];

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error("Failed to log out:", err);
    }
  };

  return (
    <aside 
      className={`fixed top-0 left-0 z-40 h-screen transition-all duration-300 ease-in-out border-r border-slate-200/50 dark:border-slate-800/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex flex-col justify-between ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Brand Header */}
      <div>
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-200/50 dark:border-slate-800/50">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="p-2 rounded-lg bg-gradient-to-tr from-primary-600 to-indigo-600 text-white shadow-md shadow-primary-500/10">
              <GraduationCap size={22} />
            </div>
            {!collapsed && (
              <span className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 whitespace-nowrap">
                PlacementAI
              </span>
            )}
          </div>
          <button 
            onClick={toggleCollapse}
            className="p-1.5 rounded-lg border border-slate-200/50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Menu Items */}
        <nav className="p-3 space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                  isActive 
                    ? "bg-primary-600 text-white shadow-lg shadow-primary-600/20" 
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Icon size={20} className={isActive ? "text-white" : "text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200"} />
                {!collapsed && (
                  <span className="text-sm font-medium whitespace-nowrap">{item.name}</span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User profile details & Logout */}
      <div className="p-3 border-t border-slate-200/50 dark:border-slate-800/50">
        {!collapsed ? (
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200/30 dark:border-slate-800/30">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary-500 to-indigo-500 text-white font-bold flex items-center justify-center text-sm shadow-inner">
                {user?.displayName ? user.displayName.charAt(0) : "A"}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold truncate text-slate-800 dark:text-slate-200">
                  {user?.displayName || "Placement Admin"}
                </p>
                <p className="text-[10px] text-slate-500 truncate dark:text-slate-400">
                  {user?.email || "admin@college.edu"}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center space-x-2 w-full py-1.5 rounded-lg border border-rose-200 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-xs font-medium transition-colors"
            >
              <LogOut size={14} />
              <span>Log Out</span>
            </button>
          </div>
        ) : (
          <button
            onClick={handleLogout}
            title="Log Out"
            className="flex items-center justify-center w-12 h-12 mx-auto rounded-xl border border-rose-200 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
          >
            <LogOut size={18} />
          </button>
        )}
      </div>
    </aside>
  );
};
export default Sidebar;
