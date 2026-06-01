import React, { useState, useEffect } from "react";
import { dbService } from "../services/firebase";
import { 
  Building2, 
  UserCheck, 
  Award, 
  Briefcase, 
  TrendingUp, 
  Percent, 
  Calendar,
  Sparkles,
  ArrowUpRight
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";

export const Dashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [students, setStudents] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Interactive Filters
  const [selectedYear, setSelectedYear] = useState("All");
  const [selectedDept, setSelectedDept] = useState("All");

  const [filteredKpis, setFilteredKpis] = useState({
    companies: 0,
    placed: 0,
    internships: 0,
    fullTime: 0,
    highest: 0,
    avgPackage: 0,
    percentage: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const studList = await dbService.getStudents();
        const compList = await dbService.getCompanies();
        const analyticsData = await dbService.getAnalytics();
        
        setStudents(studList);
        setCompanies(compList);
        setAnalytics(analyticsData);
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Update KPIs based on year and department filters
  useEffect(() => {
    if (students.length === 0 && companies.length === 0) return;

    let targetStudents = [...students];
    let targetCompanies = [...companies];

    // Filter students
    if (selectedDept !== "All") {
      targetStudents = targetStudents.filter(s => s.department === selectedDept);
    }
    
    // Filter by year
    // Note: companies have a 'year' attribute, students might have it mapped or we check their register/company year.
    if (selectedYear !== "All") {
      const yearNum = parseInt(selectedYear);
      targetCompanies = targetCompanies.filter(c => c.year === yearNum);
      
      // Filter students placed/interned in that company year
      targetStudents = targetStudents.filter(s => {
        if (!s.selectedCompany) return false;
        const comp = companies.find(c => c.companyName === s.selectedCompany && c.year === yearNum);
        return !!comp;
      });
    }

    const totalComps = targetCompanies.length;
    const totalPlaced = targetStudents.filter(s => s.placementStatus === "Placed").length;
    const totalIntern = targetStudents.filter(s => s.placementStatus === "Interned").length;
    
    const placedPacks = targetStudents.filter(s => s.placementStatus === "Placed" && s.package > 0).map(s => s.package);
    const highest = placedPacks.length ? Math.max(...placedPacks) : 0;
    const avg = placedPacks.length ? placedPacks.reduce((a, b) => a + b, 0) / placedPacks.length : 0;

    // Placement percentage of 4th year eligible students in this filtered set
    const eligible4th = targetStudents.filter(s => s.yearOfStudy === "4th Year");
    const placed4th = eligible4th.filter(s => s.placementStatus === "Placed").length;
    const pct = eligible4th.length ? (placed4th / eligible4th.length) * 100 : 0;

    setFilteredKpis({
      companies: totalComps,
      placed: totalPlaced,
      internships: totalIntern,
      fullTime: targetStudents.filter(s => s.offerType === "Full-Time").length,
      highest: highest.toFixed(1),
      avgPackage: avg.toFixed(2),
      percentage: Math.round(pct)
    });

  }, [selectedYear, selectedDept, students, companies]);

  if (loading || !analytics) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="relative w-16 h-16">
          <div className="absolute top-0 left-0 w-full h-full border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  const kpis = filteredKpis;
  const COLORS = ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#ec4899"];
  const monthlyTrends = analytics.monthlyTrends || [];
  const deptStats = analytics.deptStats || [];
  const topRecruiters = analytics.topRecruiters || [];
  const recruiterActivity = analytics.recruiterActivity || [];

  return (
    <div className="space-y-6 slide-in">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between p-6 rounded-3xl bg-gradient-to-r from-primary-600 to-indigo-600 text-white shadow-xl shadow-primary-500/10">
        <div>
          <div className="flex items-center space-x-2">
            <Sparkles size={20} className="text-yellow-300" />
            <h2 className="text-2xl font-bold tracking-wide">Campus Recruitment Analytics</h2>
          </div>
          <p className="text-xs text-primary-100 mt-1.5 max-w-xl">
            Real-time insight engine tracking internship offers, full-time placements, and algorithmic student predictions.
          </p>
        </div>
        
        {/* Dynamic Filters */}
        <div className="flex items-center space-x-3 mt-4 md:mt-0">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-primary-200 mb-1">Batch Year</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-primary-500 bg-primary-700 text-white text-xs font-semibold focus:outline-none"
            >
              <option value="All">All Years</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
            </select>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-primary-200 mb-1">Department</span>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-primary-500 bg-primary-700 text-white text-xs font-semibold focus:outline-none"
            >
              <option value="All">All Departments</option>
              <option value="CSE">CSE</option>
              <option value="IT">IT</option>
              <option value="ECE">ECE</option>
              <option value="EEE">EEE</option>
              <option value="MECH">MECH</option>
              <option value="AI-DS">AI-DS</option>
              <option value="AI-ML">AI-ML</option>
            </select>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Companies */}
        <div className="glass-card p-5 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Recruiters Visiting</p>
            <h3 className="text-3xl font-bold">{kpis.companies}</h3>
            <span className="text-[10px] text-emerald-500 font-semibold flex items-center">
              Active drives in session
            </span>
          </div>
          <div className="p-3.5 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
            <Building2 size={24} />
          </div>
        </div>

        {/* Placed Students */}
        <div className="glass-card p-5 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Placed Students</p>
            <h3 className="text-3xl font-bold">{kpis.placed}</h3>
            <span className="text-[10px] text-emerald-500 font-semibold">
              Full-time onboarded
            </span>
          </div>
          <div className="p-3.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <UserCheck size={24} />
          </div>
        </div>

        {/* Internship Offers */}
        <div className="glass-card p-5 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Internship Offers</p>
            <h3 className="text-3xl font-bold">{kpis.internships}</h3>
            <span className="text-[10px] text-indigo-500 font-semibold">
              3rd & 4th year combined
            </span>
          </div>
          <div className="p-3.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Briefcase size={24} />
          </div>
        </div>

        {/* Highest Package */}
        <div className="glass-card p-5 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Highest Package</p>
            <h3 className="text-3xl font-bold">{kpis.highest} <span className="text-xs font-semibold text-slate-400">LPA</span></h3>
            <span className="text-[10px] text-slate-500">Avg: {kpis.avgPackage} LPA</span>
          </div>
          <div className="p-3.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Award size={24} />
          </div>
        </div>
      </div>

      {/* Analytics Second Grid: Circular Gauge and Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Placement Percentage Ring */}
        <div className="glass-card p-6 rounded-2xl flex flex-col items-center justify-center space-y-4">
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 self-start">Placement Percentage</h4>
          
          <div className="relative flex items-center justify-center w-40 h-40">
            {/* SVG Progress Circle */}
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="80"
                cy="80"
                r="65"
                stroke="currentColor"
                strokeWidth="10"
                className="text-slate-200 dark:text-slate-800"
                fill="transparent"
              />
              <circle
                cx="80"
                cy="80"
                r="65"
                stroke="currentColor"
                strokeWidth="10"
                className="text-primary-600 dark:text-primary-400 gauge-path"
                style={{
                  "--stroke-dasharray": "408",
                  "--initial-offset": "408",
                  "--target-offset": 408 - (408 * kpis.percentage) / 100
                }}
                fill="transparent"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute text-center">
              <span className="text-4xl font-extrabold">{kpis.percentage}%</span>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Placed Rate</p>
            </div>
          </div>
          <p className="text-[11px] text-center text-slate-500 dark:text-slate-400">
            Calculated dynamically based on eligible final year students.
          </p>
        </div>

        {/* Monthly Hiring Area Chart */}
        <div className="glass-card p-6 rounded-2xl lg:col-span-2">
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">Monthly Recruiting Funnel</h4>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIntern" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorFT" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:stroke-slate-800" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="#94A3B8" />
                <YAxis tick={{ fontSize: 10 }} stroke="#94A3B8" />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" name="Internships" dataKey="interns" stroke="#3b82f6" fillOpacity={1} fill="url(#colorIntern)" strokeWidth={2} />
                <Area type="monotone" name="Full-Time" dataKey="fullTime" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorFT)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Grid: Department Placements & Top Recruiters */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department placement bar chart */}
        <div className="glass-card p-6 rounded-2xl">
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">Department Placement Ratios</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:stroke-slate-800" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#94A3B8" />
                <YAxis tick={{ fontSize: 10 }} stroke="#94A3B8" />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                <Bar name="Total Students" dataKey="total" fill="#3b82f6" opacity={0.6} radius={[4, 4, 0, 0]} />
                <Bar name="Placed / Interned" dataKey="placed" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Recruiters Pie Chart */}
        <div className="glass-card p-6 rounded-2xl flex flex-col justify-between">
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">Top Placement Recruiters</h4>
          <div className="flex flex-col sm:flex-row items-center justify-around h-64">
            <div className="w-48 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={topRecruiters}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="count"
                  >
                    {topRecruiters.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Custom Legend */}
            <div className="space-y-2 mt-4 sm:mt-0">
              {topRecruiters.map((entry, index) => (
                <div key={entry.name} className="flex items-center space-x-2.5">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                  <span className="text-xs font-semibold">{entry.name}</span>
                  <span className="text-[11px] text-slate-400">({entry.count} offers)</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recruiter Activity Tracking */}
      <div className="glass-card p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Active Recruitment Drives & Packages</h4>
          <span className="text-[10px] font-bold text-primary-500 uppercase tracking-widest flex items-center">
            Updated live <ArrowUpRight size={14} className="ml-1" />
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Recruiter</th>
                <th className="py-3 px-4">Expected Package</th>
                <th className="py-3 px-4">Total Offers</th>
                <th className="py-3 px-4">Visit Date</th>
              </tr>
            </thead>
            <tbody>
              {recruiterActivity.map((activity, idx) => (
                <tr key={idx} className="border-b border-slate-100 dark:border-slate-800/40 hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                  <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">{activity.name}</td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                    {activity.package > 0 ? `${activity.package} LPA` : "Stipend Only"}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 dark:bg-primary-950/20 dark:text-primary-400 font-bold">
                      {activity.hiredCount} Hired
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-500">{activity.visitDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default Dashboard;
