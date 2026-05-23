import React, { useState, useEffect } from "react";
import { mockDb } from "../services/mockDb";
import { isFirebaseEnabled } from "../services/firebase";
import { mlService } from "../services/mlService";
import { 
  Settings as SettingsIcon, 
  Database, 
  Cpu, 
  RefreshCw, 
  Check, 
  CheckCircle,
  AlertTriangle 
} from "lucide-react";

export const Settings = () => {
  const [settings, setSettings] = useState({ mlEndpoint: "http://localhost:5000" });
  const [success, setSuccess] = useState("");
  const [mlStatus, setMlStatus] = useState("checking");
  const [mlDetails, setMlDetails] = useState(null);

  useEffect(() => {
    // Load current settings
    const loaded = mockDb.getSettings();
    setSettings(loaded);
    
    // Check ML backend connection
    checkConnection();
  }, []);

  const checkConnection = async () => {
    setMlStatus("checking");
    const res = await mlService.checkHealth();
    if (res.online) {
      setMlStatus("online");
      setMlDetails(res);
    } else {
      setMlStatus("offline");
      setMlDetails(null);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    mockDb.saveSettings({ mlEndpoint: settings.mlEndpoint });
    setSuccess("Settings saved successfully.");
    setTimeout(() => setSuccess(""), 3000);
    checkConnection();
  };

  const handleResetDb = () => {
    if (window.confirm("WARNING: This will reset the database, erasing all custom student/company entries and restoring default records. Continue?")) {
      mockDb.resetDb();
      setSuccess("Database successfully reset to default sample dataset.");
      setTimeout(() => {
        setSuccess("");
        window.location.reload();
      }, 1500);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl slide-in">
      
      {success && (
        <div className="flex items-center space-x-2 p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-900/50 text-emerald-400 text-xs">
          <Check size={16} />
          <span>{success}</span>
        </div>
      )}

      {/* Main Settings Form */}
      <div className="glass-card p-6 rounded-2xl">
        <div className="flex items-center space-x-2.5 mb-4 pb-2 border-b border-slate-200 dark:border-slate-800">
          <SettingsIcon className="text-primary-600 dark:text-primary-400" size={18} />
          <h3 className="text-sm font-bold">API & Endpoint Configurations</h3>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">
              Flask Machine Learning API URL
            </label>
            <div className="flex gap-3">
              <input
                type="url"
                required
                placeholder="http://localhost:5000"
                value={settings.mlEndpoint}
                onChange={(e) => setSettings({ ...settings, mlEndpoint: e.target.value })}
                className="flex-1 py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:border-primary-500 focus:outline-none text-xs"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-primary-500/10"
              >
                Save & Connect
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-1.5">
              Specifies the hostname where the Python Flask service is active (default is http://localhost:5000).
            </p>
          </div>
        </form>
      </div>

      {/* ML Connection Details */}
      <div className="glass-card p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-2.5">
            <Cpu className="text-primary-600 dark:text-primary-400" size={18} />
            <h3 className="text-sm font-bold">ML Backend Connection Status</h3>
          </div>
          <button
            onClick={checkConnection}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
            title="Refresh Connection"
          >
            <RefreshCw size={14} className={mlStatus === "checking" ? "animate-spin" : ""} />
          </button>
        </div>

        {mlStatus === "checking" ? (
          <div className="py-4 flex items-center space-x-2 text-xs text-slate-500">
            <div className="w-4 h-4 border border-slate-400 border-t-transparent rounded-full animate-spin"></div>
            <span>Pinging endpoint...</span>
          </div>
        ) : mlStatus === "online" ? (
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-emerald-500 text-xs font-bold">
              <CheckCircle size={16} />
              <span>Connected to Flask ML API Service (Healthy)</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800/50 text-[10px] font-semibold space-y-1">
              <p>Placement Model Classifier Loaded: {mlDetails?.models_loaded?.placement ? "Yes" : "No"}</p>
              <p>Salary Model Regressor Loaded: {mlDetails?.models_loaded?.salary ? "Yes" : "No"}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-amber-500 text-xs font-bold">
              <AlertTriangle size={16} />
              <span>Offline: Python Flask server is not responding at {settings.mlEndpoint}</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              The interface will automatically fallback to client-side mathematical approximation models. To connect the real Python Scikit-learn backend, run the following commands in the `ml-service` folder:
            </p>
            <pre className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-[10px] text-indigo-400 font-mono">
              pip install -r requirements.txt{"\n"}
              python app.py
            </pre>
          </div>
        )}
      </div>

      {/* Database Mode Card */}
      <div className="glass-card p-6 rounded-2xl">
        <div className="flex items-center space-x-2.5 mb-4 pb-2 border-b border-slate-200 dark:border-slate-800">
          <Database className="text-primary-600 dark:text-primary-400" size={18} />
          <h3 className="text-sm font-bold">Database & Storage Status</h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold">Active Database System</span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
              isFirebaseEnabled() 
                ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400" 
                : "bg-amber-100 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400"
            }`}>
              {isFirebaseEnabled() ? "Firebase Realtime Firestore" : "Local Storage Mock database"}
            </span>
          </div>

          {!isFirebaseEnabled() && (
            <div className="p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/10 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              <span className="font-bold text-amber-500">Firebase Fallback Mode is active.</span> To hook up real cloud collections, populate your Vite environment keys inside a <span className="font-mono text-slate-700 dark:text-slate-200">.env</span> file in the <span className="font-mono text-slate-700 dark:text-slate-200">frontend</span> directory:
              <pre className="mt-2 p-2 bg-slate-900 border border-slate-800 rounded-lg text-[9px] text-slate-400 font-mono">
                VITE_FIREBASE_API_KEY=your-api-key{"\n"}
                VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain{"\n"}
                VITE_FIREBASE_PROJECT_ID=your-project-id
              </pre>
            </div>
          )}

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              onClick={handleResetDb}
              className="px-4 py-2.5 rounded-xl border border-rose-200 dark:border-rose-900/30 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-xs font-semibold transition-colors"
            >
              Reset Mock Database Records
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};
export default Settings;
