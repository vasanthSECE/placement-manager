import React, { useState, useEffect } from "react";
import { dbService } from "../services/firebase";
import { mlService } from "../services/mlService";
import { 
  Brain, 
  Sparkles, 
  ChevronRight, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight, 
  BookOpen, 
  Award,
  DollarSign,
  Cpu,
  GraduationCap
} from "lucide-react";

export const MLPredictions = () => {
  const [students, setStudents] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [loadingPredict, setLoadingPredict] = useState(false);
  const [isFallbackMode, setIsFallbackMode] = useState(false);

  // Form Fields (Sync with Student)
  const [profile, setProfile] = useState({
    name: "Custom Profile",
    cgpa: 7.5,
    department: "CSE",
    aptitudeScore: 70,
    communicationScore: 70,
    internshipExperience: 0,
    skills: "React, Node.js, SQL",
    certifications: "AWS Cloud Practitioner"
  });

  // Prediction Results
  const [placementProb, setPlacementProb] = useState(null);
  const [expectedSalary, setExpectedSalary] = useState(null);
  const [recommendedCompanies, setRecommendedCompanies] = useState([]);
  const [selectedTargetCompany, setSelectedTargetCompany] = useState("");
  const [skillGapResults, setSkillGapResults] = useState(null);

  // Load students for dropdown
  useEffect(() => {
    const loadDropdownData = async () => {
      try {
        const studList = await dbService.getStudents();
        const compList = await dbService.getCompanies();
        setStudents(studList);
        setCompanies(compList);
        
        // Auto select first student if available
        if (studList.length > 0) {
          handleStudentSelect(studList[0].id, studList);
        }
      } catch (err) {
        console.error("Error fetching students for predictions dropdown:", err);
      }
    };
    loadDropdownData();
  }, []);

  const handleStudentSelect = (id, list = students) => {
    setSelectedStudentId(id);
    const stud = list.find(s => s.id === id);
    if (stud) {
      setProfile({
        name: stud.name,
        cgpa: stud.cgpa,
        department: stud.department,
        aptitudeScore: stud.aptitudeScore || 70,
        communicationScore: stud.communicationScore || 70,
        internshipExperience: stud.internshipExperience || 0,
        skills: stud.skills ? stud.skills.join(", ") : "",
        certifications: stud.certifications ? stud.certifications.join(", ") : ""
      });
      // Reset prediction results
      setPlacementProb(null);
      setExpectedSalary(null);
      setRecommendedCompanies([]);
      setSkillGapResults(null);
      setSelectedTargetCompany("");
    }
  };

  const handlePredict = async (e) => {
    e.preventDefault();
    setLoadingPredict(true);
    setPlacementProb(null);
    setExpectedSalary(null);
    setRecommendedCompanies([]);
    setSkillGapResults(null);
    setSelectedTargetCompany("");

    const skillsArray = profile.skills.split(",").map(s => s.trim()).filter(Boolean);
    const certsArray = profile.certifications.split(",").map(s => s.trim()).filter(Boolean);

    const payload = {
      cgpa: Number(profile.cgpa),
      department: profile.department,
      aptitudeScore: Number(profile.aptitudeScore),
      communicationScore: Number(profile.communicationScore),
      internshipExperience: Number(profile.internshipExperience),
      skills: skillsArray,
      certifications: certsArray
    };

    try {
      // 1. Placement prediction
      const placementRes = await mlService.predictPlacement(payload);
      if (placementRes.success) {
        setPlacementProb(placementRes.placementProbability);
        setIsFallbackMode(!!placementRes.isFallback);
      }

      // 2. Salary prediction
      const salaryRes = await mlService.predictSalary(payload);
      if (salaryRes.success) {
        setExpectedSalary(salaryRes.expectedSalary);
      }

      // 3. Recommend companies
      const recommendRes = await mlService.recommendCompanies(payload, companies);
      if (recommendRes.success) {
        setRecommendedCompanies(recommendRes.recommendations);
        // Pre-select the highest match company for skill gap analysis
        if (recommendRes.recommendations.length > 0) {
          handleTargetCompanySelect(recommendRes.recommendations[0].companyName, recommendRes.recommendations);
        }
      }

    } catch (err) {
      console.error("AI Predictions API transaction failed:", err);
    } finally {
      setLoadingPredict(false);
    }
  };

  const handleTargetCompanySelect = async (compName, list = recommendedCompanies) => {
    setSelectedTargetCompany(compName);
    const reco = list.find(r => r.companyName === compName);
    
    // Find company details to extract requirements
    const matchedComp = companies.find(c => c.companyName === compName);
    const requiredSkills = matchedComp ? matchedComp.skillsRequired : ["Data Structures", "Algorithms", "Java", "SQL", "React"];

    if (reco) {
      const skillsArray = profile.skills.split(",").map(s => s.trim()).filter(Boolean);
      try {
        const gapRes = await mlService.analyzeSkillGap(skillsArray, requiredSkills);
        if (gapRes.success) {
          setSkillGapResults(gapRes);
        }
      } catch (err) {
        console.error("Error analyzing skill gap:", err);
      }
    }
  };

  return (
    <div className="space-y-6 slide-in">
      {/* Header card */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-primary-600/10 text-primary-600 dark:text-primary-400">
            <Brain size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold">AI Predictive Models</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Logistic regression probability solvers and skill mapping matrices.</p>
          </div>
        </div>

        {/* Info banner */}
        {isFallbackMode && (
          <div className="flex items-center space-x-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-full text-[10px] font-bold mt-3 md:mt-0">
            <Cpu size={12} />
            <span>Running Offline Emulation</span>
          </div>
        )}
      </div>

      {/* Primary configuration columns */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left column: Student Profile Config */}
        <div className="glass-card p-6 rounded-2xl h-fit">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold">Student Profile Parameters</h3>
            <Sparkles size={16} className="text-primary-500" />
          </div>

          {/* Quick select dropdown */}
          <div className="mb-5">
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Load Student Record</label>
            <select
              value={selectedStudentId}
              onChange={(e) => handleStudentSelect(e.target.value)}
              className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:border-primary-500 font-semibold"
            >
              <option value="">-- Manual Custom Profile --</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.department})</option>
              ))}
            </select>
          </div>

          {/* Profile form */}
          <form onSubmit={handlePredict} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">CGPA</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  required
                  value={profile.cgpa}
                  onChange={(e) => setProfile({ ...profile, cgpa: e.target.value, name: "Custom Profile" })}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-xs"
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Department</label>
                <select
                  value={profile.department}
                  onChange={(e) => setProfile({ ...profile, department: e.target.value, name: "Custom Profile" })}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-xs"
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Aptitude Score</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={profile.aptitudeScore}
                  onChange={(e) => setProfile({ ...profile, aptitudeScore: e.target.value, name: "Custom Profile" })}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-xs"
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Comm Score</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={profile.communicationScore}
                  onChange={(e) => setProfile({ ...profile, communicationScore: e.target.value, name: "Custom Profile" })}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Prior Internships</label>
              <input
                type="number"
                min="0"
                max="5"
                value={profile.internshipExperience}
                onChange={(e) => setProfile({ ...profile, internshipExperience: e.target.value, name: "Custom Profile" })}
                className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-xs"
              />
            </div>

            <div>
              <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Skills (Comma separated)</label>
              <textarea
                rows="2"
                value={profile.skills}
                onChange={(e) => setProfile({ ...profile, skills: e.target.value, name: "Custom Profile" })}
                className="w-full py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-xs resize-none"
              />
            </div>

            <div>
              <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Certifications (Comma separated)</label>
              <input
                type="text"
                value={profile.certifications}
                onChange={(e) => setProfile({ ...profile, certifications: e.target.value, name: "Custom Profile" })}
                className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={loadingPredict}
              className="flex items-center justify-center w-full py-3 rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-primary-500/20 active:scale-[0.98] disabled:opacity-50 transition-all"
            >
              {loadingPredict ? "Evaluating Model..." : "Run AI Predictions"}
            </button>
          </form>
        </div>

        {/* Right column: Results Output */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* Prediction Gauge Block */}
          <div className="glass-card p-6 rounded-2xl">
            <h3 className="text-sm font-bold mb-4 pb-2 border-b border-slate-200 dark:border-slate-800">
              Analysis Results: {profile.name}
            </h3>

            {loadingPredict ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-3">
                <div className="w-10 h-10 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs text-slate-500">Executing classification and regression pipelines...</span>
              </div>
            ) : placementProb === null ? (
              <div className="py-14 text-center text-slate-400 text-xs italic">
                Input student parameters on the left and click "Run AI Predictions" to see probability analytics.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                {/* Radial Gauge */}
                <div className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-950/30 rounded-2xl border border-slate-200/40 dark:border-slate-800/40">
                  <span className="text-[10px] uppercase font-bold text-slate-400 mb-3">Placement Probability</span>
                  
                  <div className="relative flex items-center justify-center w-36 h-36">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="72"
                        cy="72"
                        r="58"
                        stroke="currentColor"
                        strokeWidth="8"
                        className="text-slate-200 dark:text-slate-800"
                        fill="transparent"
                      />
                      <circle
                        cx="72"
                        cy="72"
                        r="58"
                        stroke="currentColor"
                        strokeWidth="8"
                        className={`${
                          placementProb >= 80 
                            ? "text-emerald-500" 
                            : placementProb >= 60 
                            ? "text-amber-500" 
                            : "text-rose-500"
                        } gauge-path`}
                        style={{
                          "--stroke-dasharray": "364",
                          "--initial-offset": "364",
                          "--target-offset": 364 - (364 * placementProb) / 100
                        }}
                        fill="transparent"
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute text-center">
                      <span className="text-3xl font-extrabold">{placementProb}%</span>
                    </div>
                  </div>
                  
                  <p className="text-[11px] font-semibold mt-3 text-slate-600 dark:text-slate-400">
                    {placementProb >= 80 
                      ? "High Probability Cohort" 
                      : placementProb >= 60 
                      ? "Moderate Opportunity Risk" 
                      : "High Support Required"}
                  </p>
                </div>

                {/* Salary Package prediction */}
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-950/30 rounded-2xl border border-slate-200/40 dark:border-slate-800/40 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">Expected Salary Package</span>
                      <h4 className="text-2xl font-bold mt-1 text-slate-800 dark:text-white">
                        {expectedSalary ? `${expectedSalary} LPA` : "N/A"}
                      </h4>
                    </div>
                    <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
                      <DollarSign size={20} />
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-950/30 rounded-2xl border border-slate-200/40 dark:border-slate-800/40 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">Academic Status</span>
                      <h4 className="text-sm font-semibold mt-1.5 text-slate-800 dark:text-slate-300">
                        CGPA: {profile.cgpa} / 10.0
                      </h4>
                    </div>
                    <div className="p-3 bg-violet-500/10 text-violet-600 dark:text-violet-400 rounded-xl">
                      <GraduationCap size={20} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Company Recommendation Engine */}
          {placementProb !== null && recommendedCompanies.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Recommendations list */}
              <div className="glass-card p-6 rounded-2xl">
                <h3 className="text-sm font-bold mb-4 pb-2 border-b border-slate-200 dark:border-slate-800">
                  Recommended Recruiters
                </h3>
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {recommendedCompanies.map((reco) => (
                    <button
                      key={reco.companyName}
                      onClick={() => handleTargetCompanySelect(reco.companyName)}
                      className={`w-full text-left p-3 rounded-xl border transition-all ${
                        selectedTargetCompany === reco.companyName
                          ? "bg-primary-600/15 border-primary-500"
                          : "bg-slate-50/50 dark:bg-slate-950/20 border-slate-200/50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-850"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold">{reco.companyName}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          reco.matchPercentage >= 75
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400"
                        }`}>
                          {reco.matchPercentage}% Match
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">{reco.role} • {reco.package > 0 ? `${reco.package} LPA` : `${reco.stipend}/mo`}</p>
                      
                      <div className="flex items-center space-x-1.5 mt-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${reco.isEligible ? "bg-emerald-500" : "bg-rose-500"}`}></span>
                        <span className="text-[9px] font-medium text-slate-400">
                          {reco.isEligible ? "Eligible (GPA & Dept match)" : "Ineligible constraints apply"}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Skill Gap Analysis visualizer */}
              <div className="glass-card p-6 rounded-2xl">
                <h3 className="text-sm font-bold mb-4 pb-2 border-b border-slate-200 dark:border-slate-800">
                  Skill Gap & Learning Path
                </h3>

                {skillGapResults ? (
                  <div className="space-y-4 text-xs">
                    {/* Header summary */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/60">
                      <span className="font-semibold">Company: {selectedTargetCompany}</span>
                      <span className="font-bold text-primary-600 dark:text-primary-400">
                        {skillGapResults.skillsMatchCount} / {skillGapResults.totalCompanySkills} Skills matched
                      </span>
                    </div>

                    {/* Missing skills */}
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">Missing Technologies</span>
                      {skillGapResults.missingSkills.length === 0 ? (
                        <div className="flex items-center space-x-1.5 text-emerald-500 font-semibold text-xs">
                          <CheckCircle2 size={14} />
                          <span>No skill gaps! Profile matches requirements perfectly.</span>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {skillGapResults.missingSkills.map((skill, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 font-semibold text-[10px]">
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Improvement Suggestions */}
                    {skillGapResults.improvementSuggestions.length > 0 && (
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">Actionable Advices</span>
                        <ul className="space-y-1.5 list-disc pl-4 text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                          {skillGapResults.improvementSuggestions.slice(0, 3).map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Recommended Learning Path */}
                    {skillGapResults.recommendedLearningPaths.length > 0 && (
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">Learning Roadmap</span>
                        <div className="space-y-2">
                          {skillGapResults.recommendedLearningPaths.slice(0, 2).map((path, idx) => (
                            <div key={idx} className="flex items-start space-x-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                              <BookOpen size={13} className="shrink-0 text-primary-500 mt-0.5" />
                              <span>{path}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                ) : (
                  <div className="py-12 text-center text-slate-400 text-xs italic">
                    Select a recommended company to run skill gap mapping.
                  </div>
                )}
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};
export default MLPredictions;
