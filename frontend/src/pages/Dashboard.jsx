import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { dbService } from "../services/firebase";
import { mlService } from "../services/mlService";
import { 
  Building2, 
  UserCheck, 
  Award, 
  Briefcase, 
  TrendingUp, 
  Percent, 
  Calendar,
  Sparkles,
  ArrowUpRight,
  GraduationCap,
  BookOpen,
  CheckCircle2,
  ArrowRight,
  Zap
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
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const studentId = user?.studentId || "stud-1"; // Default to Aditya Sharma for student view

  const [analytics, setAnalytics] = useState(null);
  const [students, setStudents] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Student-specific states
  const [studentProfile, setStudentProfile] = useState(null);
  const [predictedProbability, setPredictedProbability] = useState(null);
  const [predictedSalary, setPredictedSalary] = useState(null);

  // Profile setup wizard states
  const [selectedExistingId, setSelectedExistingId] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState(user?.displayName || "");
  const [newRegNo, setNewRegNo] = useState("");
  const [newDept, setNewDept] = useState("CSE");
  const [newYear, setNewYear] = useState("4th Year");
  const [newCgpa, setNewCgpa] = useState("8.0");
  const [newSkills, setNewSkills] = useState("");
  const [newCerts, setNewCerts] = useState("");
  const [newInternships, setNewInternships] = useState("0");

  // Interactive Filters (Admin)
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

        // 1. Check linked student ID in localStorage
        let linkedId = localStorage.getItem("linked_student_id_" + user?.uid);
        
        // 2. Try to find student in list
        let activeStudent = null;
        if (linkedId) {
          activeStudent = studList.find(s => s.id === linkedId);
        }
        
        // 3. Auto-match by name if not explicitly linked
        if (!activeStudent && user?.displayName && user?.displayName !== "Aditya Sharma" && user?.displayName !== "Google Admin" && user?.displayName !== "Placement Admin") {
          const cleanName = user.displayName.toLowerCase().replace(/[^a-z0-9]/g, "");
          activeStudent = studList.find(s => {
            const cleanSName = s.name.toLowerCase().replace(/[^a-z0-9]/g, "");
            return cleanSName.includes(cleanName) || cleanName.includes(cleanSName);
          });
          if (activeStudent) {
            localStorage.setItem("linked_student_id_" + user?.uid, activeStudent.id);
          }
        }
        
        // 4. Default mock-student credentials mapping to Aditya Sharma
        if (!activeStudent && user?.uid === "mock-student") {
          activeStudent = studList.find(s => s.id === "stud-1") || studList[0];
        }

        if (activeStudent) {
          setStudentProfile(activeStudent);
          
          // Fetch predictions
          const placementRes = await mlService.predictPlacement({
            cgpa: activeStudent.cgpa,
            aptitudeScore: activeStudent.aptitudeScore || 70,
            communicationScore: activeStudent.communicationScore || 70,
            internshipExperience: activeStudent.internshipExperience || 0,
            certifications: activeStudent.certifications || [],
            skills: activeStudent.skills || [],
            department: activeStudent.department || "CSE"
          });
          
          const shadowSalaryRes = await mlService.predictSalary({
            cgpa: activeStudent.cgpa,
            internshipExperience: activeStudent.internshipExperience || 0,
            certifications: activeStudent.certifications || [],
            skills: activeStudent.skills || []
          });

          if (placementRes?.success) {
            setPredictedProbability(placementRes.placementProbability);
          }
          if (shadowSalaryRes?.success) {
            setPredictedSalary(shadowSalaryRes.expectedSalary);
          }
        }
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [studentId, user]);

  const handleLinkExisting = (e) => {
    e.preventDefault();
    if (!selectedExistingId) return;
    localStorage.setItem("linked_student_id_" + user?.uid, selectedExistingId);
    window.location.reload();
  };

  const handleCreateAndLink = async (e) => {
    e.preventDefault();
    if (!newName || !newRegNo) return;
    
    const parsedSkills = newSkills ? newSkills.split(",").map(s => s.trim()).filter(Boolean) : [];
    const parsedCerts = newCerts ? newCerts.split(",").map(c => c.trim()).filter(Boolean) : [];
    
    const newStudent = {
      name: newName,
      registerNumber: newRegNo,
      department: newDept,
      yearOfStudy: newYear,
      cgpa: parseFloat(newCgpa) || 8.0,
      skills: parsedSkills,
      certifications: parsedCerts,
      internshipExperience: parseInt(newInternships) || 0,
      aptitudeScore: 75,
      communicationScore: 75,
      placementStatus: "Unplaced",
      selectedCompany: "",
      offerType: "",
      package: 0
    };
    
    setLoading(true);
    try {
      await dbService.saveStudent(newStudent);
      const updatedStudList = await dbService.getStudents();
      const created = updatedStudList.find(s => s.registerNumber === newRegNo);
      if (created) {
        localStorage.setItem("linked_student_id_" + user?.uid, created.id);
      }
      window.location.reload();
    } catch (err) {
      console.error("Error creating student record:", err);
      alert("Failed to create profile. Please check inputs.");
    } finally {
      setLoading(false);
    }
  };

  // Update KPIs based on year and department filters (for Admin Dashboard)
  useEffect(() => {
    if (students.length === 0 && companies.length === 0) return;

    let targetStudents = [...students];
    let targetCompanies = [...companies];

    // Filter students
    if (selectedDept !== "All") {
      targetStudents = targetStudents.filter(s => s.department === selectedDept);
    }
    
    // Filter by year
    if (selectedYear !== "All") {
      const yearNum = parseInt(selectedYear);
      targetCompanies = targetCompanies.filter(c => c.year === yearNum);
      
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

  // --- RENDER STUDENT DASHBOARD ---
  if (!isAdmin) {
    if (!studentProfile) {
      return (
        <div className="space-y-6 max-w-2xl mx-auto slide-in py-8">
          <div className="glass-card p-8 rounded-3xl space-y-6 bg-slate-950/40 border border-slate-800">
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-primary-500/20">
                <GraduationCap size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Setup Your Career Profile</h3>
              <p className="text-xs text-slate-400">
                We couldn't find an existing student record linked to your email (**{user?.email}**). Choose an option below to get started.
              </p>
            </div>

            {/* Toggle Tab */}
            <div className="flex p-1.5 bg-slate-100 dark:bg-slate-900 rounded-xl">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                  !showCreate 
                    ? "bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 shadow-sm animate-pulse-slow" 
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                }`}
              >
                Link to Existing Student Record
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(true)}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                  showCreate 
                    ? "bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 shadow-sm animate-pulse-slow" 
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                }`}
              >
                Create New Profile
              </button>
            </div>

            {/* OPTION 1: LINK EXISTING PROFILE */}
            {!showCreate ? (
              <form onSubmit={handleLinkExisting} className="space-y-4">
                <div className="space-y-1.5 flex flex-col">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Select Your Name
                  </label>
                  <select
                    required
                    value={selectedExistingId}
                    onChange={(e) => setSelectedExistingId(e.target.value)}
                    className="w-full py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:border-primary-500 focus:outline-none text-xs text-slate-800 dark:text-slate-200"
                  >
                    <option value="">Choose your record from database...</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.registerNumber} - {s.department})
                      </option>
                    ))}
                  </select>
                </div>
                
                <button
                  type="submit"
                  disabled={!selectedExistingId}
                  className="w-full py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-primary-500/10 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                >
                  Link Account & Enter Portal
                </button>
              </form>
            ) : (
              /* OPTION 2: CREATE NEW PROFILE */
              <form onSubmit={handleCreateAndLink} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="e.g. Vasanth R"
                      className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:border-primary-500 focus:outline-none text-xs text-slate-800 dark:text-slate-100"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Register Number
                    </label>
                    <input
                      type="text"
                      required
                      value={newRegNo}
                      onChange={(e) => setNewRegNo(e.target.value)}
                      placeholder="e.g. 312221104050"
                      className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:border-primary-500 focus:outline-none text-xs text-slate-800 dark:text-slate-100"
                    />
                  </div>

                  <div className="space-y-1 flex flex-col">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Department
                    </label>
                    <select
                      value={newDept}
                      onChange={(e) => setNewDept(e.target.value)}
                      className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:border-primary-500 focus:outline-none text-xs text-slate-800 dark:text-slate-200"
                    >
                      <option value="CSE">CSE</option>
                      <option value="IT">IT</option>
                      <option value="ECE">ECE</option>
                      <option value="EEE">EEE</option>
                      <option value="MECH">MECH</option>
                      <option value="AI-DS">AI-DS</option>
                      <option value="AI-ML">AI-ML</option>
                    </select>
                  </div>

                  <div className="space-y-1 flex flex-col">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Year of Study
                    </label>
                    <select
                      value={newYear}
                      onChange={(e) => setNewYear(e.target.value)}
                      className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:border-primary-500 focus:outline-none text-xs text-slate-800 dark:text-slate-200"
                    >
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="4th Year">4th Year</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Cumulative GPA (CGPA)
                    </label>
                    <input
                      type="number"
                      required
                      step="0.01"
                      min="0"
                      max="10"
                      value={newCgpa}
                      onChange={(e) => setNewCgpa(e.target.value)}
                      className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:border-primary-500 focus:outline-none text-xs text-slate-800 dark:text-slate-100"
                    />
                  </div>

                  <div className="space-y-1 flex flex-col">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Internship Count
                    </label>
                    <select
                      value={newInternships}
                      onChange={(e) => setNewInternships(e.target.value)}
                      className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:border-primary-500 focus:outline-none text-xs text-slate-800 dark:text-slate-200"
                    >
                      <option value="0">0 Internships</option>
                      <option value="1">1 Internship</option>
                      <option value="2">2 Internships</option>
                      <option value="3">3+ Internships</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Skills (Comma Separated)
                  </label>
                  <input
                    type="text"
                    value={newSkills}
                    onChange={(e) => setNewSkills(e.target.value)}
                    placeholder="e.g. Python, React, SQL, Algorithms"
                    className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:border-primary-500 focus:outline-none text-xs text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Certifications (Comma Separated)
                  </label>
                  <input
                    type="text"
                    value={newCerts}
                    onChange={(e) => setNewCerts(e.target.value)}
                    placeholder="e.g. AWS Cloud Practitioner, Google Data Analytics"
                    className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:border-primary-500 focus:outline-none text-xs text-slate-800 dark:text-slate-100"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-500/10 transition-colors"
                >
                  Create Profile & Enter Portal
                </button>
              </form>
            )}
          </div>
        </div>
      );
    }

    // Filter companies matching student's department eligibility
    const studentDept = studentProfile.department || "CSE";
    const eligibleCompanies = companies
      .filter(c => c.eligibleDepartments?.includes(studentDept))
      .slice(0, 5);

    return (
      <div className="space-y-6 slide-in">
        {/* Student Top Welcome Banner */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between p-6 rounded-3xl bg-gradient-to-r from-primary-600 to-indigo-600 text-white shadow-xl shadow-primary-500/10">
          <div>
            <div className="flex items-center space-x-2">
              <Sparkles size={20} className="text-yellow-300" />
              <h2 className="text-2xl font-bold tracking-wide">Welcome Back, {studentProfile.name}! 🚀</h2>
            </div>
            <p className="text-xs text-primary-100 mt-1.5 max-w-xl">
              Track your profile metrics, predicted placement potential, and target recruitment opportunities in one dashboard.
            </p>
            <button
              onClick={() => {
                if (window.confirm("Disconnect your account from this student profile? You will return to the profile setup screen.")) {
                  localStorage.removeItem("linked_student_id_" + user?.uid);
                  window.location.reload();
                }
              }}
              className="text-[9px] text-primary-200 hover:text-white underline font-semibold mt-2.5 block text-left"
            >
              Switch Linked Student Profile
            </button>
          </div>
          
          <div className="mt-4 md:mt-0 flex gap-3">
            <Link
              to="/interview"
              className="flex items-center space-x-1.5 px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold rounded-xl transition-all shadow-md"
            >
              <Zap size={14} className="text-yellow-300" />
              <span>Launch Mock Interview</span>
            </Link>
            <Link
              to="/predictions"
              className="flex items-center space-x-1.5 px-4 py-2 bg-slate-950 text-white text-xs font-semibold rounded-xl hover:bg-slate-900 transition-all shadow-md"
            >
              <span>Match Sandbox</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* Student Profile KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* CGPA */}
          <div className="glass-card p-5 rounded-2xl flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">CGPA Average</p>
              <h3 className="text-3xl font-bold">{studentProfile.cgpa} <span className="text-xs font-semibold text-slate-400">/ 10</span></h3>
              <span className="text-[10px] text-emerald-500 font-semibold">Excellent Academic Standing</span>
            </div>
            <div className="p-3.5 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
              <GraduationCap size={24} />
            </div>
          </div>

          {/* Technical Skills */}
          <div className="glass-card p-5 rounded-2xl flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Key Technical Skills</p>
              <h3 className="text-3xl font-bold">{studentProfile.skills?.length || 0}</h3>
              <span className="text-[10px] text-indigo-500 font-semibold truncate block max-w-[150px]">
                {studentProfile.skills?.slice(0, 2).join(", ")}...
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <BookOpen size={24} />
            </div>
          </div>

          {/* Certifications */}
          <div className="glass-card p-5 rounded-2xl flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Certifications</p>
              <h3 className="text-3xl font-bold">{studentProfile.certifications?.length || 0}</h3>
              <span className="text-[10px] text-indigo-500 font-semibold">Professional Credentials</span>
            </div>
            <div className="p-3.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Award size={24} />
            </div>
          </div>

          {/* Status */}
          <div className="glass-card p-5 rounded-2xl flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Placement Status</p>
              <h3 className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">
                {studentProfile.placementStatus || "Seeking"}
              </h3>
              {studentProfile.selectedCompany ? (
                <span className="text-[10px] text-slate-500">At {studentProfile.selectedCompany} ({studentProfile.package} LPA)</span>
              ) : (
                <span className="text-[10px] text-slate-500">Actively matching drives</span>
              )}
            </div>
            <div className="p-3.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <UserCheck size={24} />
            </div>
          </div>
        </div>

        {/* Student Analytics & Matches Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* AI Placement Probability Meter */}
          <div className="glass-card p-6 rounded-2xl flex flex-col items-center justify-center space-y-4">
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 self-start">AI Predicted Placement Potential</h4>
            
            <div className="relative flex items-center justify-center w-40 h-40">
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
                    "--target-offset": 408 - (408 * (predictedProbability || 50)) / 100
                  }}
                  fill="transparent"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute text-center">
                <span className="text-4xl font-extrabold">{predictedProbability !== null ? `${predictedProbability}%` : "Calculating..."}</span>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Fit Score</p>
              </div>
            </div>
            
            <div className="text-center">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Expected Package: {predictedSalary ? `${predictedSalary} LPA` : "Calculating..."}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                Based on your academic profile, skill match, and internships.
              </p>
            </div>
          </div>

          {/* Upcoming Recruiter Drives & Eligibility */}
          <div className="glass-card p-6 rounded-2xl lg:col-span-2 space-y-4">
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Recommended Recruiter Drives (Eligible)</h4>
            <div className="space-y-3.5">
              {eligibleCompanies.map((company, index) => {
                const isEligible = studentProfile.cgpa >= company.minimumCGPA;
                return (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-950/20 hover:bg-slate-50 dark:hover:bg-slate-950/50 transition-colors"
                  >
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{company.companyName}</p>
                      <p className="text-[10px] text-slate-500 font-medium">Role: {company.role} | Min GPA: {company.minimumCGPA}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {company.skillsRequired?.slice(0, 3).map((s, idx) => (
                          <span key={idx} className="px-1.5 py-0.5 rounded text-[8px] font-semibold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end space-y-1">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {company.package > 0 ? `${company.package} LPA` : `${company.stipend}/mo`}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        isEligible 
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400" 
                          : "bg-rose-100 text-rose-800 dark:bg-rose-950/20 dark:text-rose-400"
                      }`}>
                        {isEligible ? "Eligible" : "Below GPA"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* AI Career Coaching Call to Action */}
        <div className="glass-card p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1 md:max-w-xl">
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-2">
              <Sparkles size={16} className="text-yellow-500" />
              <span>Boost Your Placement Strategy with AI Coaching</span>
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Use our AI Mock Interview Coach to practice company-specific interview prompts. The engine will evaluate your code logic, communication, and STAR formatting and deliver real-time report feedback.
            </p>
          </div>
          <Link
            to="/interview"
            className="flex items-center justify-center space-x-1.5 px-5 py-3 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold shadow-lg shadow-primary-600/10 transition-all shrink-0 active:scale-[0.98]"
          >
            <span>Start Practice Interview</span>
            <Zap size={14} className="text-yellow-300" />
          </Link>
        </div>
      </div>
    );
  }

  // --- RENDER ADMIN DASHBOARD (DEFAULT ORIGINAL) ---
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
            <h2 className="text-2xl font-bold tracking-wide">Campus Recruitment Analytics (Admin)</h2>
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
