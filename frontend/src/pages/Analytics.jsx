import React, { useState, useEffect } from "react";
import { dbService } from "../services/firebase";
import { BarChart3, TrendingUp, HelpCircle, Download } from "lucide-react";
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

export const Analytics = () => {
  const [students, setStudents] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedDept, setSelectedDept] = useState("All");
  const [selectedYear, setSelectedYear] = useState("All");

  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true);
      try {
        const studList = await dbService.getStudents();
        const compList = await dbService.getCompanies();
        const analyticsData = await dbService.getAnalytics();
        
        setStudents(studList);
        setCompanies(compList);
        setAnalytics(analyticsData);
      } catch (err) {
        console.error("Error loading analytics data:", err);
      } finally {
        setLoading(true ? setLoading(false) : null);
      }
    };
    loadAllData();
  }, []);

  if (loading || !analytics) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="w-12 h-12 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // ----------------------------------------------------
  // FILTERED DATA CALCULATIONS
  // ----------------------------------------------------
  let filteredStudents = [...students];
  if (selectedDept !== "All") {
    filteredStudents = filteredStudents.filter(s => s.department === selectedDept);
  }
  if (selectedYear !== "All") {
    // Filter students placed in companies visiting in that year
    const yearVal = parseInt(selectedYear);
    filteredStudents = filteredStudents.filter(s => {
      if (!s.selectedCompany) return false;
      const comp = companies.find(c => c.companyName === s.selectedCompany && c.year === yearVal);
      return !!comp;
    });
  }

  // 1. Internship vs Full-Time ratio
  const totalOffers = filteredStudents.filter(s => s.placementStatus === "Placed" || s.placementStatus === "Interned").length;
  const ftCount = filteredStudents.filter(s => s.offerType === "Full-Time").length;
  const internCount = filteredStudents.filter(s => s.placementStatus === "Interned").length;

  const ratioData = [
    { name: "Full-Time Offers", value: ftCount },
    { name: "Internship Offers", value: internCount }
  ];

  // 2. Company Hiring Comparison
  const hiringCounts = {};
  filteredStudents.forEach(s => {
    if (s.selectedCompany && (s.placementStatus === "Placed" || s.placementStatus === "Interned")) {
      hiringCounts[s.selectedCompany] = (hiringCounts[s.selectedCompany] || 0) + 1;
    }
  });
  const companyHiringData = Object.entries(hiringCounts)
    .map(([name, count]) => {
      // Find package
      const comp = companies.find(c => c.companyName === name);
      return {
        name,
        count,
        package: comp ? comp.package : 0
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // COLORS for pie chart
  const COLORS = ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b"];

  return (
    <div className="space-y-6 slide-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/50 dark:border-slate-800/50">
        <div>
          <div className="flex items-center space-x-2">
            <BarChart3 className="text-primary-600 dark:text-primary-400" size={22} />
            <h2 className="text-xl font-bold">Advanced Analytics</h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Compare recruiters, inspect package distribution curves, and audit historical hiring statistics.
          </p>
        </div>

        {/* Global Controls */}
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold focus:outline-none"
          >
            <option value="All">All Departments</option>
            <option value="CSE">CSE</option>
            <option value="IT">IT</option>
            <option value="ECE">ECE</option>
            <option value="EEE">EEE</option>
            <option value="MECH">MECH</option>
            <option value="CIVIL">CIVIL</option>
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold focus:outline-none"
          >
            <option value="All">All Years</option>
            <option value="2025">2025</option>
            <option value="2026">2026</option>
          </select>
        </div>
      </div>

      {/* Main charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Internship vs Full Time Ratio */}
        <div className="glass-card p-6 rounded-2xl flex flex-col justify-between">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">Internship vs Full-Time Ratio</h3>
          {totalOffers === 0 ? (
            <div className="h-60 flex items-center justify-center text-slate-400 text-xs italic">
              No placement offers recorded for the current filters.
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-around h-60">
              <div className="w-48 h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={ratioData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {ratioData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3 mt-4 sm:mt-0">
                {ratioData.map((entry, idx) => (
                  <div key={entry.name} className="flex items-center space-x-2.5">
                    <div className="w-3.5 h-3.5 rounded" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                    <div>
                      <p className="text-xs font-semibold">{entry.name}</p>
                      <p className="text-[10px] text-slate-400 font-medium">
                        {entry.value} Offers ({totalOffers > 0 ? Math.round((entry.value / totalOffers) * 100) : 0}%)
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Chart 2: Company Hiring Comparison */}
        <div className="glass-card p-6 rounded-2xl">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">Company Hiring Volume & CTC</h3>
          {companyHiringData.length === 0 ? (
            <div className="h-60 flex items-center justify-center text-slate-400 text-xs italic">
              No hiring data.
            </div>
          ) : (
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={companyHiringData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:stroke-slate-800" />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} stroke="#94A3B8" />
                  <YAxis tick={{ fontSize: 10 }} stroke="#94A3B8" />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  <Bar name="Students Placed" dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  <Bar name="Package (LPA)" dataKey="package" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Chart 3: Year-wise Placement Rate Trends */}
        <div className="glass-card p-6 rounded-2xl">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">Year-wise Placement & Salary Trends</h3>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.yearWiseTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:stroke-slate-800" />
                <XAxis dataKey="year" tick={{ fontSize: 10 }} stroke="#94A3B8" />
                <YAxis yAxisId="left" tick={{ fontSize: 10 }} stroke="#94A3B8" />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} stroke="#94A3B8" />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                <Line yAxisId="left" type="monotone" name="Placement Rate (%)" dataKey="placementRate" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 7 }} />
                <Line yAxisId="right" type="monotone" name="Average Salary (LPA)" dataKey="averagePackage" stroke="#10b981" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 7 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Department-wise Placement Graph */}
        <div className="glass-card p-6 rounded-2xl">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">Department Placement Ratios</h3>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.deptStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:stroke-slate-800" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#94A3B8" />
                <YAxis tick={{ fontSize: 10 }} stroke="#94A3B8" />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                <Bar name="Total Students" dataKey="total" fill="#3b82f6" opacity={0.5} radius={[4, 4, 0, 0]} />
                <Bar name="Placed / Interned" dataKey="placed" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Cohort Insight Widget */}
      <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center space-x-2.5 mb-3">
          <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500 dark:text-indigo-400">
            <TrendingUp size={18} />
          </span>
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">Cohort Placement Performance Analysis</h4>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-4xl">
          Based on filtered data, the cohort consists of <span className="font-semibold text-slate-700 dark:text-slate-200">{filteredStudents.length} students</span>. 
          The overall hiring activities register <span className="font-semibold text-slate-700 dark:text-slate-200">{totalOffers} successful selections</span>, 
          leading to a placement conversion rate of <span className="font-semibold text-emerald-500">{filteredStudents.length ? Math.round((totalOffers / filteredStudents.length) * 100) : 0}%</span>. 
          To maximize student success, coordinate with departments showing placement percentages below 70% to conduct focused aptitude workshops and resume-polishing activities.
        </p>
      </div>
    </div>
  );
};
export default Analytics;
