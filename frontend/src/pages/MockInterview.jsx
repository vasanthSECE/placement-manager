import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { dbService } from "../services/firebase";
import { geminiService } from "../services/geminiService";
import {
  Sparkles,
  ChevronRight,
  Send,
  RefreshCw,
  Trophy,
  AlertCircle,
  ThumbsUp,
  AlertTriangle,
  Play,
  ArrowLeft,
  User,
  Target,
  Compass,
  Clock,
  CheckCircle,
  BookOpen
} from "lucide-react";

export const MockInterview = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const studentId = user?.studentId || localStorage.getItem("linked_student_id_" + user?.uid);

  // Stages: "setup" | "interview" | "report"
  const [stage, setStage] = useState("setup");
  const [loading, setLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);

  // Setup options
  const [students, setStudents] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [targetRole, setTargetRole] = useState("Software Engineer");
  const [focusArea, setFocusArea] = useState("Technical (DSA & OOP)");

  // Chat log & interaction
  const [chatLog, setChatLog] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isGeminiActive, setIsGeminiActive] = useState(false);

  // Results report
  const [report, setReport] = useState(null);

  // Ref & timer
  const chatEndRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    const initData = async () => {
      try {
        const studList = await dbService.getStudents();
        const compList = await dbService.getCompanies();
        setStudents(studList);
        setCompanies(compList);

        // Auto select current student profile
        let activeStudent = null;
        if (studentId) {
          activeStudent = studList.find(s => s.id === studentId);
        } else if (isAdmin) {
          activeStudent = studList[0];
        }
        
        setSelectedStudent(activeStudent);

        if (compList.length > 0) {
          setSelectedCompany(compList[0].companyName);
        }
      } catch (err) {
        console.error("Error loading interview data:", err);
      }
    };
    initData();
    setIsGeminiActive(geminiService.isConfigured());
  }, [studentId, isAdmin]);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatLog, loading]);

  // Timer effect
  useEffect(() => {
    if (stage === "interview") {
      timerRef.current = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [stage]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const startInterview = async () => {
    if (!selectedStudent) return;
    setElapsedTime(0);
    setChatLog([]);
    setStage("interview");
    setLoading(true);

    try {
      // Trigger the AI to generate the first question
      const initialGreeting = await geminiService.generateResponse(
        [],
        selectedStudent,
        selectedCompany,
        targetRole,
        focusArea
      );

      setChatLog([
        {
          id: "greet-1",
          sender: "ai",
          text: initialGreeting,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
      ]);
    } catch (err) {
      console.error("Error starting mock interview:", err);
      setChatLog([
        {
          id: "err-1",
          sender: "ai",
          text: "Hello! There was a connection issue initiating the session. Let's start: Can you introduce yourself and state your primary technical projects?",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || loading) return;

    const userMsg = {
      id: "usr-" + Date.now(),
      sender: "user",
      text: inputMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setChatLog((prev) => [...prev, userMsg]);
    setInputMessage("");
    setLoading(true);

    try {
      // Send message log to Gemini
      const updatedLog = [...chatLog, userMsg];
      const aiReply = await geminiService.generateResponse(
        updatedLog,
        selectedStudent,
        selectedCompany,
        targetRole,
        focusArea
      );

      setChatLog((prev) => [
        ...prev,
        {
          id: "ai-" + Date.now(),
          sender: "ai",
          text: aiReply,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
      ]);
    } catch (err) {
      console.error("Error sending response:", err);
    } finally {
      setLoading(false);
    }
  };

  const endAndEvaluate = async () => {
    setEvaluating(true);
    try {
      const evaluation = await geminiService.evaluateInterview(
        chatLog,
        selectedStudent,
        selectedCompany,
        targetRole
      );
      setReport(evaluation);
      setStage("report");
    } catch (err) {
      console.error("Error generating evaluation report:", err);
    } finally {
      setEvaluating(false);
    }
  };

  // Turn count
  const turnsCount = chatLog.filter((m) => m.sender === "user").length;

  if (!selectedStudent && !isAdmin) {
    return (
      <div className="space-y-6 max-w-md mx-auto py-12 text-center slide-in">
        <div className="glass-card p-8 rounded-3xl bg-slate-950/40 border border-slate-800 space-y-4">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-rose-500/20 text-amber-500 flex items-center justify-center border border-amber-500/10">
            <AlertCircle size={24} />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 font-sans">Profile Link Required</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            You need to link your account to a student profile or create a student profile on the Dashboard before launching the AI Mock Interview Coach.
          </p>
          <Link
            to="/"
            className="mt-2 w-full py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-primary-500/10 transition-colors block text-center"
          >
            Go to Dashboard Setup
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto slide-in font-sans">
      
      {/* Dynamic API Status banner */}
      <div className={`p-3.5 rounded-2xl flex items-center justify-between border ${
        isGeminiActive 
          ? "bg-emerald-950/20 border-emerald-900/50 text-emerald-400" 
          : "bg-amber-950/20 border-amber-900/50 text-amber-400"
      } text-xs`}>
        <div className="flex items-center space-x-2">
          <Sparkles className={isGeminiActive ? "animate-pulse" : ""} size={16} />
          <span>
            {isGeminiActive 
              ? "Live Google Gemini AI active: Generating real-time custom technical questions." 
              : "Gemini Key missing: Running in Offline Mock Simulation Mode."
            }
          </span>
        </div>
        {!isGeminiActive && isAdmin && (
          <Link to="/settings" className="underline font-bold hover:text-amber-300">
            Configure API Key
          </Link>
        )}
      </div>

      {/* STAGE 1: SETUP PANEL */}
      {stage === "setup" && (
        <div className="glass-card p-6 rounded-3xl space-y-6">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-primary-600/10 text-primary-600 dark:text-primary-400">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">AI Mock Interview Coach</h3>
              <p className="text-xs text-slate-500">Configure parameters to practice role-specific corporate interviews.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Student selection (Admin only) */}
            {isAdmin ? (
              <div className="flex flex-col space-y-2">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider flex items-center">
                  <User size={12} className="mr-1.5" /> Select Student Profile (Admin Mode)
                </label>
                <select
                  value={selectedStudent?.id || ""}
                  onChange={(e) => setSelectedStudent(students.find(s => s.id === e.target.value))}
                  className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:border-primary-500 focus:outline-none text-xs"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.department} - GPA: {s.cgpa})</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800/50 space-y-2">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider flex items-center">
                  <User size={12} className="mr-1.5" /> Candidate Profile
                </label>
                <p className="text-xs font-bold">{selectedStudent?.name}</p>
                <p className="text-[10px] text-slate-400">
                  {selectedStudent?.department} Department | CGPA: {selectedStudent?.cgpa}
                </p>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {selectedStudent?.skills?.map((s, idx) => (
                    <span key={idx} className="px-1.5 py-0.5 rounded text-[8px] bg-primary-100 text-primary-700 dark:bg-primary-950/20 dark:text-primary-400 font-semibold">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Target Recruiter Company */}
            <div className="flex flex-col space-y-2">
              <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider flex items-center">
                <Target size={12} className="mr-1.5" /> Target Recruiter
              </label>
              <select
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:border-primary-500 focus:outline-none text-xs"
              >
                {companies.map((c) => (
                  <option key={c.id} value={c.companyName}>{c.companyName} ({c.role})</option>
                ))}
              </select>
            </div>

            {/* Target Role Title */}
            <div className="flex flex-col space-y-2">
              <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider flex items-center">
                <Compass size={12} className="mr-1.5" /> Target Designation / Role
              </label>
              <input
                type="text"
                required
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="Software Engineer, Data Analyst, etc."
                className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:border-primary-500 focus:outline-none text-xs"
              />
            </div>

            {/* Focus area */}
            <div className="flex flex-col space-y-2">
              <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider flex items-center">
                <BookOpen size={12} className="mr-1.5" /> Interview Focus Area
              </label>
              <select
                value={focusArea}
                onChange={(e) => setFocusArea(e.target.value)}
                className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:border-primary-500 focus:outline-none text-xs"
              >
                <option value="Technical (DSA & OOP)">Technical (Data Structures, Algorithms & OOP)</option>
                <option value="Behavioral (STAR format)">Behavioral (Leadership & STAR format)</option>
                <option value="System Design & Scalability">System Design & Scalability</option>
                <option value="Mixed General Placement Screen">Mixed (General Placement Round)</option>
              </select>
            </div>

          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
            <button
              onClick={startInterview}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-indigo-600 text-white rounded-xl text-xs font-semibold shadow-lg shadow-primary-500/10 hover:shadow-primary-500/20 active:scale-[0.98] transition-all"
            >
              <Play size={14} />
              <span>Start Mock Interview Session</span>
            </button>
          </div>
        </div>
      )}

      {/* STAGE 2: ACTIVE INTERVIEW CHAT */}
      {stage === "interview" && (
        <div className="glass-card flex flex-col h-[75vh] rounded-3xl overflow-hidden shadow-2xl relative">
          
          {/* Interview Header */}
          <div className="bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between text-white">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  if (window.confirm("Abort mock interview? Progress will be lost.")) {
                    setStage("setup");
                  }
                }}
                className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors"
                title="Cancel Session"
              >
                <ArrowLeft size={16} />
              </button>
              <div>
                <h4 className="text-sm font-bold truncate">Interview with {selectedCompany}</h4>
                <p className="text-[10px] text-slate-400">Target: {targetRole} | Candidate: {selectedStudent?.name}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-800 text-[11px] font-semibold text-slate-300">
                <Clock size={12} className="text-primary-400" />
                <span>{formatTime(elapsedTime)}</span>
              </div>
              <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-800 text-[11px] font-semibold text-slate-300">
                <span>Progress: {turnsCount}/3 Questions</span>
              </div>
            </div>
          </div>

          {/* Chat message list */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-950/20">
            {chatLog.map((msg, index) => {
              const isAi = msg.sender === "ai";
              return (
                <div key={msg.id || index} className={`flex ${isAi ? "justify-start" : "justify-end"} items-start gap-2.5`}>
                  {isAi && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-md shrink-0">
                      AI
                    </div>
                  )}
                  <div className="flex flex-col space-y-1 max-w-[75%]">
                    <div className={`p-4 rounded-2xl text-xs leading-relaxed ${
                      isAi 
                        ? "bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 text-slate-800 dark:text-slate-200 rounded-tl-none shadow-sm" 
                        : "bg-primary-600 text-white rounded-tr-none shadow-lg shadow-primary-500/5"
                    }`}>
                      {msg.text.split("\n").map((line, lIdx) => (
                        <p key={lIdx} className={lIdx > 0 ? "mt-2" : ""}>{line}</p>
                      ))}
                    </div>
                    <span className={`text-[9px] text-slate-400 font-medium ${isAi ? "text-left" : "text-right"}`}>
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* AI thinking state */}
            {loading && (
              <div className="flex justify-start items-center space-x-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xs animate-pulse">
                  AI
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 px-4 py-3 rounded-2xl rounded-tl-none flex items-center space-x-1 shadow-sm">
                  <div className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                  <div className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                  <div className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                </div>
              </div>
            )}
            
            <div ref={chatEndRef} />
          </div>

          {/* Evaluate trigger banner (visible once they hit 3 turns) */}
          {turnsCount >= 3 && !loading && (
            <div className="p-3.5 bg-primary-600/10 border-t border-primary-500/25 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
              <div className="flex items-center space-x-2 text-primary-400 font-bold">
                <CheckCircle size={16} />
                <span>You have successfully answered 3 questions! You can now finish the interview to get evaluated.</span>
              </div>
              <button
                onClick={endAndEvaluate}
                disabled={evaluating}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-bold flex items-center justify-center space-x-1 shadow-md shadow-primary-600/15 shrink-0"
              >
                {evaluating ? (
                  <>
                    <RefreshCw className="animate-spin" size={14} />
                    <span>Analyzing Transcript...</span>
                  </>
                ) : (
                  <>
                    <Trophy size={14} />
                    <span>Evaluate & Review Report</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Chat Message Input form */}
          <form onSubmit={sendMessage} className="p-4 bg-slate-900 border-t border-slate-800 flex gap-3">
            <textarea
              required
              rows={1}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={turnsCount >= 3 ? "Interview complete. Click Evaluate above to generate results!" : "Type your technical or behavioral response..."}
              disabled={loading || turnsCount >= 3}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(e);
                }
              }}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-800 bg-slate-950 focus:border-primary-500 focus:outline-none text-xs text-white resize-none"
            />
            <button
              type="submit"
              disabled={loading || !inputMessage.trim() || turnsCount >= 3}
              className="p-3 bg-primary-600 hover:bg-primary-500 text-white rounded-xl flex items-center justify-center hover:shadow-lg disabled:opacity-30 disabled:pointer-events-none transition-all"
            >
              <Send size={16} />
            </button>
          </form>

        </div>
      )}

      {/* STAGE 3: DETAILED PERFORMANCE REPORT */}
      {stage === "report" && report && (
        <div className="space-y-6">
          
          {/* Top Score Banner */}
          <div className="glass-card p-6 rounded-3xl bg-slate-950/40 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-primary-500/15">
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-primary-600 to-indigo-600 text-white shadow-xl shadow-primary-500/10 flex items-center justify-center font-extrabold text-2xl border border-primary-400/20 shrink-0">
                {report.score}
              </div>
              <div className="space-y-1">
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-primary-100 text-primary-800 dark:bg-primary-950/30 dark:text-primary-400">
                  Performance Summary
                </span>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  {selectedCompany} Mock Interview Feedback
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Candidate: {selectedStudent?.name} | Designation: {targetRole}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStage("setup")}
                className="px-4 py-2.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-xl transition-colors"
              >
                Start New Interview
              </button>
              <Link
                to="/"
                className="px-4 py-2.5 bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold rounded-xl shadow-md transition-colors"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>

          {/* Breakdown Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Strengths Card */}
            <div className="glass-card p-6 rounded-3xl space-y-4 border border-emerald-500/15">
              <div className="flex items-center space-x-2 text-emerald-500">
                <ThumbsUp size={18} />
                <h4 className="text-sm font-bold uppercase tracking-wide">Key Strengths</h4>
              </div>
              <div className="space-y-3">
                {report.strengths?.map((str, idx) => (
                  <div key={idx} className="flex gap-2.5 items-start text-xs text-slate-600 dark:text-slate-300">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1.5 shrink-0"></span>
                    <p className="leading-relaxed">{str}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Improvements Card */}
            <div className="glass-card p-6 rounded-3xl space-y-4 border border-amber-500/15">
              <div className="flex items-center space-x-2 text-amber-500">
                <AlertTriangle size={18} />
                <h4 className="text-sm font-bold uppercase tracking-wide">Areas of Improvement</h4>
              </div>
              <div className="space-y-3">
                {report.improvements?.map((imp, idx) => (
                  <div key={idx} className="flex gap-2.5 items-start text-xs text-slate-600 dark:text-slate-300">
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1.5 shrink-0"></span>
                    <p className="leading-relaxed">{imp}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Suggested Answers Accordion */}
          <div className="glass-card p-6 rounded-3xl space-y-4">
            <div className="flex items-center space-x-2 text-primary-600 dark:text-primary-400">
              <AlertCircle size={18} />
              <h4 className="text-sm font-bold uppercase tracking-wide">Model Interview Guidance</h4>
            </div>
            
            <div className="space-y-4">
              {report.suggestedAnswers?.map((ans, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800/50 space-y-2">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Question Domain: {ans.question}
                  </p>
                  <div className="p-3 bg-white dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-900 text-xs text-slate-500 leading-relaxed">
                    <span className="font-bold text-slate-600 dark:text-slate-400 block mb-1">Interviewer Suggestion:</span>
                    {ans.suggestedAnswer}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
export default MockInterview;
