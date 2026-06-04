import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  GraduationCap, 
  Lock, 
  Mail, 
  AlertCircle, 
  Sparkles, 
  Briefcase, 
  ArrowLeft,
  ShieldAlert
} from "lucide-react";

export const Login = () => {
  const { login, loginWithGoogle } = useAuth();
  const [roleContext, setRoleContext] = useState(null); // null | "admin" | "student"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password, roleContext);
      navigate("/");
    } catch (err) {
      setError(err.message || "Failed to sign in. Please verify your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);
    try {
      await loginWithGoogle(roleContext);
      navigate("/");
    } catch (err) {
      setError(err.message || "Failed to sign in with Google.");
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = () => {
    if (roleContext === "admin") {
      setEmail("admin@college.edu");
      setPassword("admin123");
    } else {
      setEmail("student@college.edu");
      setPassword("student123");
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-slate-900 overflow-hidden font-sans">
      {/* Decorative Blur Blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-600/30 rounded-full blur-3xl animate-pulse-slow"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl animate-pulse-slow"></div>

      {/* Form Container */}
      <div className="relative z-10 w-full max-w-md p-8 m-4 rounded-3xl border border-slate-800/80 bg-slate-950/80 backdrop-blur-xl shadow-2xl slide-in">
        
        {/* STEP 1: ROLE SELECTION */}
        {roleContext === null ? (
          <div className="space-y-6 text-center">
            {/* Logo */}
            <div className="flex flex-col items-center mb-6">
              <div className="p-3 mb-3 rounded-2xl bg-gradient-to-tr from-primary-600 to-indigo-600 text-white shadow-xl shadow-primary-500/20">
                <GraduationCap size={32} />
              </div>
              <h2 className="text-2xl font-bold text-white tracking-wide">PlacementAI</h2>
              <p className="text-xs text-slate-400 mt-1">Select your account role to continue</p>
            </div>

            <div className="space-y-4">
              {/* Option 1: Admin */}
              <button
                onClick={() => setRoleContext("admin")}
                className="w-full text-left p-4 rounded-2xl border border-slate-800 bg-slate-900/40 hover:bg-slate-900/80 hover:border-primary-500/50 transition-all duration-300 flex items-start space-x-4 group"
              >
                <div className="p-2.5 rounded-xl bg-primary-600/10 text-primary-400 group-hover:bg-primary-600/20 group-hover:text-primary-300 transition-colors shrink-0">
                  <ShieldAlert size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Placement Officer / Admin</h4>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    Manage student database, recruiter drives, configure API settings, and track campus statistics.
                  </p>
                </div>
              </button>

              {/* Option 2: Student */}
              <button
                onClick={() => setRoleContext("student")}
                className="w-full text-left p-4 rounded-2xl border border-slate-800 bg-slate-900/40 hover:bg-slate-900/80 hover:border-indigo-500/50 transition-all duration-300 flex items-start space-x-4 group"
              >
                <div className="p-2.5 rounded-xl bg-indigo-600/10 text-indigo-400 group-hover:bg-indigo-600/20 group-hover:text-indigo-300 transition-colors shrink-0">
                  <GraduationCap size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Student Portal</h4>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    Practice AI mock interviews, test placement matching sandbox, and track target drives.
                  </p>
                </div>
              </button>
            </div>
          </div>
        ) : (
          /* STEP 2: CREDENTIALS / SIGN-IN FORM */
          <div className="space-y-6">
            {/* Header / Back navigation */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <button
                onClick={() => {
                  setRoleContext(null);
                  setError("");
                  setEmail("");
                  setPassword("");
                }}
                className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft size={14} />
                <span>Role Selection</span>
              </button>
              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                roleContext === "admin" 
                  ? "bg-primary-950/40 border border-primary-500/20 text-primary-400" 
                  : "bg-indigo-950/40 border border-indigo-500/20 text-indigo-400"
              }`}>
                Role: {roleContext === "admin" ? "Admin" : "Student"}
              </span>
            </div>

            <div className="text-center">
              <h3 className="text-lg font-bold text-white">
                Sign in as {roleContext === "admin" ? "Placement Officer" : "Student"}
              </h3>
              <p className="text-xs text-slate-400 mt-1">Authenticate using credentials or social accounts</p>
            </div>

            {error && (
              <div className="flex items-center space-x-2 p-3 rounded-xl bg-rose-950/30 border border-rose-900/50 text-rose-400 text-xs">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                    <Mail size={16} />
                  </span>
                  <input
                    type="email"
                    required
                    placeholder={roleContext === "admin" ? "admin@college.edu" : "student@college.edu"}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full py-2.5 pl-10 pr-4 rounded-xl border border-slate-800 bg-slate-900/50 text-white text-sm focus:border-primary-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                    <Lock size={16} />
                  </span>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full py-2.5 pl-10 pr-4 rounded-xl border border-slate-800 bg-slate-900/50 text-white text-sm focus:border-primary-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center w-full py-3 rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 text-white font-semibold text-sm hover:from-primary-500 hover:to-indigo-500 shadow-lg shadow-primary-500/20 hover:shadow-primary-500/30 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? "Signing in..." : "Log In"}
              </button>
            </form>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-800"></div>
              <span className="flex-shrink mx-4 text-[10px] text-slate-500 uppercase tracking-widest">Or login with</span>
              <div className="flex-grow border-t border-slate-800"></div>
            </div>

            {/* Google sign-in */}
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="flex items-center justify-center w-full py-2.5 rounded-xl border border-slate-800 bg-slate-900/20 hover:bg-slate-900/40 text-slate-300 text-sm font-medium transition-colors"
            >
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google Account
            </button>

            {/* Demo Credentials Info */}
            <div className="mt-4 p-4 rounded-2xl bg-slate-900/40 border border-slate-800 text-center">
              <div className="flex items-center justify-center space-x-1.5 text-xs font-semibold text-amber-400 mb-1.5">
                <Sparkles size={14} />
                <span>Developer Demo Credentials</span>
              </div>
              <p className="text-[10px] text-slate-400 mb-2">
                Log in quickly using the custom credentials configured for this role.
              </p>
              <button
                type="button"
                onClick={fillDemoCredentials}
                className="px-4 py-1.5 rounded-lg bg-primary-600/20 text-primary-400 border border-primary-500/20 hover:bg-primary-600/35 text-xs font-medium transition-colors"
              >
                Fill {roleContext === "admin" ? "Admin" : "Student"} Demo
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
export default Login;
