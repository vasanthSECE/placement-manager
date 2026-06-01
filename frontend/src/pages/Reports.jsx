import React, { useState, useEffect } from "react";
import { dbService } from "../services/firebase";
import { exportToCSV, printReport } from "../utils/exportHelpers";
import { 
  FileSpreadsheet, 
  FileText, 
  Download, 
  Upload, 
  Info, 
  Check, 
  AlertTriangle 
} from "lucide-react";

export const Reports = () => {
  const [students, setStudents] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [reportType, setReportType] = useState("students");
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const loadReportData = async () => {
      setLoading(true);
      try {
        const studList = await dbService.getStudents();
        const compList = await dbService.getCompanies();
        setStudents(studList);
        setCompanies(compList);
      } catch (err) {
        console.error("Error loading report tables:", err);
      } finally {
        setLoading(false);
      }
    };
    loadReportData();
  }, []);

  const getDepartmentSummary = () => {
    const depts = ["CSE", "IT", "ECE", "EEE", "MECH", "AI-DS", "AI-ML"];
    return depts.map(dept => {
      const deptStudents = students.filter(s => s.department === dept);
      const placed = deptStudents.filter(s => s.placementStatus === "Placed" || s.placementStatus === "Interned");
      const packages = placed.filter(s => s.package > 0).map(s => s.package);
      const avg = packages.length ? packages.reduce((a, b) => a + b, 0) / packages.length : 0;
      
      return {
        department: dept,
        totalStudents: deptStudents.length,
        placedStudents: placed.length,
        placementRate: deptStudents.length ? Math.round((placed.length / deptStudents.length) * 100) + "%" : "0%",
        averagePackage: avg.toFixed(2) + " LPA"
      };
    });
  };

  const handleExportCSV = () => {
    if (reportType === "students") {
      const headers = ["name", "registerNumber", "department", "yearOfStudy", "cgpa", "placementStatus", "selectedCompany", "package"];
      exportToCSV(students, headers, "student_placements_report.csv");
    } else if (reportType === "companies") {
      const headers = ["companyName", "role", "offerType", "package", "minimumCGPA", "totalSelected", "year"];
      exportToCSV(companies, headers, "company_recruitment_report.csv");
    } else {
      const headers = ["department", "totalStudents", "placedStudents", "placementRate", "averagePackage"];
      exportToCSV(getDepartmentSummary(), headers, "department_performance_report.csv");
    }
  };

  const handleExportPDF = () => {
    if (reportType === "students") {
      const columns = [
        { label: "Student Name", key: "name" },
        { label: "Reg Num", key: "registerNumber" },
        { label: "Dept", key: "department" },
        { label: "CGPA", key: "cgpa" },
        { label: "Status", key: "placementStatus" },
        { label: "Company", key: "selectedCompany" },
        { label: "LPA", key: "package" }
      ];
      printReport("Student Placement & Academic Report", columns, students);
    } else if (reportType === "companies") {
      const columns = [
        { label: "Company Name", key: "companyName" },
        { label: "Job Role", key: "role" },
        { label: "Offer Type", key: "offerType" },
        { label: "Package", key: "package" },
        { label: "Min CGPA", key: "minimumCGPA" },
        { label: "Hired Count", key: "totalSelected" },
        { label: "Batch Year", key: "year" }
      ];
      printReport("Recruiter Visit & Hiring Analytics", columns, companies);
    } else {
      const columns = [
        { label: "Department", key: "department" },
        { label: "Total Strength", key: "totalStudents" },
        { label: "Total Placed", key: "placedStudents" },
        { label: "Placement Rate", key: "placementRate" },
        { label: "Avg Package", key: "averagePackage" }
      ];
      printReport("Department Cohort Placement Summary", columns, getDepartmentSummary());
    }
  };

  const downloadCsvTemplate = () => {
    const headers = [
      "name",
      "registerNumber",
      "department",
      "yearOfStudy",
      "cgpa",
      "skills",
      "certifications",
      "internshipExperience",
      "aptitudeScore",
      "communicationScore",
      "placementStatus",
      "selectedCompany",
      "offerType",
      "package"
    ];
    const sampleRow = [
      "Jane Doe",
      "312221104999",
      "CSE",
      "4th Year",
      "8.5",
      "React;Node.js;Python",
      "AWS Practitioner;Google Professional",
      "1",
      "85",
      "90",
      "Placed",
      "Google",
      "Full-Time",
      "28.5"
    ];
    
    const csvContent = [headers.join(","), sampleRow.join(",")].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "student_import_template.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setSuccess("Template downloaded. Open in Excel/CSV Editor to fill data.");
    setTimeout(() => setSuccess(""), 4000);
  };

  const handleBulkUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const text = evt.target.result;
        const rows = text.split("\n").map(r => r.trim()).filter(Boolean);
        if (rows.length <= 1) {
          setError("CSV file is empty or missing headers.");
          return;
        }

        const headers = rows[0].split(",").map(h => h.trim().replace(/^["']|["']$/g, ""));
        const studentsToUpload = [];

        for (let i = 1; i < rows.length; i++) {
          const rowValues = rows[i].split(",").map(v => v.trim().replace(/^["']|["']$/g, ""));
          if (rowValues.length < headers.length) continue;

          const rowObj = {};
          headers.forEach((header, index) => {
            rowObj[header] = rowValues[index];
          });

          // Parsing properties
          const skills = rowObj.skills ? rowObj.skills.split(";").map(s => s.trim()) : [];
          const certifications = rowObj.certifications ? rowObj.certifications.split(";").map(c => c.trim()) : [];

          const studentPayload = {
            name: rowObj.name || "Unknown Student",
            registerNumber: rowObj.registerNumber || Date.now().toString() + i,
            department: rowObj.department || "CSE",
            yearOfStudy: rowObj.yearOfStudy || "4th Year",
            cgpa: parseFloat(rowObj.cgpa || 7.0),
            skills,
            certifications,
            internshipExperience: parseInt(rowObj.internshipExperience || 0),
            aptitudeScore: parseInt(rowObj.aptitudeScore || 70),
            communicationScore: parseInt(rowObj.communicationScore || 70),
            placementStatus: rowObj.placementStatus || "Unplaced",
            selectedCompany: rowObj.selectedCompany || "",
            offerType: rowObj.offerType || "",
            package: parseFloat(rowObj.package || 0)
          };

          studentsToUpload.push(studentPayload);
        }

        setLoading(true);
        for (const stud of studentsToUpload) {
          await dbService.saveStudent(stud);
        }

        setSuccess(`Successfully imported ${studentsToUpload.length} student records!`);
        setError("");
        
        // Reload list
        const updatedList = await dbService.getStudents();
        setStudents(updatedList);
      } catch (err) {
        setError("CSV Upload parsing failed: " + err.message);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 slide-in">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Central controls */}
        <div className="space-y-6">
          
          {/* Report Selection card */}
          <div className="glass-card p-6 rounded-2xl">
            <h3 className="text-sm font-bold mb-4 pb-2 border-b border-slate-200 dark:border-slate-800">
              Report Parameters
            </h3>

            <div className="space-y-3">
              <label className="block text-[10px] font-bold text-slate-400 uppercase">Target Query Entity</label>
              <div className="grid grid-cols-1 gap-2.5">
                <button
                  onClick={() => setReportType("students")}
                  className={`py-3 px-4 rounded-xl border text-xs font-bold text-left transition-all ${
                    reportType === "students" 
                      ? "bg-primary-600 border-primary-600 text-white shadow-lg shadow-primary-600/15" 
                      : "bg-transparent border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850"
                  }`}
                >
                  Student Cohorts Placements
                </button>
                <button
                  onClick={() => setReportType("companies")}
                  className={`py-3 px-4 rounded-xl border text-xs font-bold text-left transition-all ${
                    reportType === "companies" 
                      ? "bg-primary-600 border-primary-600 text-white shadow-lg shadow-primary-600/15" 
                      : "bg-transparent border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850"
                  }`}
                >
                  Recruiter Drives & Packages
                </button>
                <button
                  onClick={() => setReportType("departments")}
                  className={`py-3 px-4 rounded-xl border text-xs font-bold text-left transition-all ${
                    reportType === "departments" 
                      ? "bg-primary-600 border-primary-600 text-white shadow-lg shadow-primary-600/15" 
                      : "bg-transparent border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850"
                  }`}
                >
                  Department Performance Summary
                </button>
              </div>
            </div>

            {/* Downloader buttons */}
            <div className="grid grid-cols-2 gap-3 mt-6 pt-5 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={handleExportCSV}
                className="flex items-center justify-center space-x-1.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold"
              >
                <FileSpreadsheet size={15} className="text-emerald-500" />
                <span>Export Excel</span>
              </button>

              <button
                onClick={handleExportPDF}
                className="flex items-center justify-center space-x-1.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold"
              >
                <FileText size={15} className="text-rose-500" />
                <span>Print PDF</span>
              </button>
            </div>
          </div>

          {/* Bulk upload Card */}
          <div className="glass-card p-6 rounded-2xl">
            <h3 className="text-sm font-bold mb-4 pb-2 border-b border-slate-200 dark:border-slate-800">
              Bulk CSV Student Import
            </h3>

            <div className="space-y-4">
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Add multiple student academic and skill profiles concurrently. Download the template sheet to ensure proper headers match database columns.
              </p>

              {success && (
                <div className="flex items-center space-x-1.5 p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-900/40 text-emerald-400 text-[10px]">
                  <Check size={14} className="shrink-0" />
                  <span>{success}</span>
                </div>
              )}

              {error && (
                <div className="flex items-center space-x-1.5 p-2.5 rounded-xl bg-rose-950/20 border border-rose-900/40 text-rose-400 text-[10px]">
                  <AlertTriangle size={14} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                onClick={downloadCsvTemplate}
                className="flex items-center justify-center space-x-1.5 w-full py-2.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 text-xs font-semibold"
              >
                <Download size={15} />
                <span>Download CSV Template</span>
              </button>

              <label className="flex items-center justify-center space-x-1.5 w-full py-2.5 rounded-xl bg-primary-600 text-white hover:bg-primary-500 text-xs font-semibold shadow-lg shadow-primary-500/10 cursor-pointer">
                <Upload size={15} />
                <span>Upload Filled CSV Sheet</span>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleBulkUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

        </div>

        {/* Right Column: Live query preview */}
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold uppercase tracking-wider">Report Preview</h3>
              <span className="text-[10px] text-slate-400">Showing top 8 records</span>
            </div>

            {loading ? (
              <div className="py-24 flex justify-center">
                <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[400px]">
                {reportType === "students" && (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                        <th className="py-2.5 px-3">Student</th>
                        <th className="py-2.5 px-3">Reg Num</th>
                        <th className="py-2.5 px-3">CGPA</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Offer Company</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.slice(0, 8).map((s) => (
                        <tr key={s.id} className="border-b border-slate-100 dark:border-slate-800/40">
                          <td className="py-3 px-3 font-semibold">{s.name}</td>
                          <td className="py-3 px-3 font-mono">{s.registerNumber}</td>
                          <td className="py-3 px-3 font-semibold">{s.cgpa.toFixed(2)}</td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              s.placementStatus === "Placed" 
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400" 
                                : s.placementStatus === "Interned"
                                ? "bg-sky-100 text-sky-700 dark:bg-sky-950/20 dark:text-sky-400"
                                : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                            }`}>
                              {s.placementStatus}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-500 font-semibold">{s.selectedCompany || "--"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {reportType === "companies" && (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                        <th className="py-2.5 px-3">Recruiter</th>
                        <th className="py-2.5 px-3">Job Role</th>
                        <th className="py-2.5 px-3">Offer Type</th>
                        <th className="py-2.5 px-3">Package</th>
                        <th className="py-2.5 px-3">Hired count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {companies.slice(0, 8).map((c) => (
                        <tr key={c.id} className="border-b border-slate-100 dark:border-slate-800/40">
                          <td className="py-3 px-3 font-semibold">{c.companyName}</td>
                          <td className="py-3 px-3">{c.role}</td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400">
                              {c.offerType}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-bold">{c.package > 0 ? `${c.package} LPA` : "Stipend"}</td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-semibold text-[10px]">
                              {c.totalSelected} Students
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {reportType === "departments" && (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                        <th className="py-2.5 px-3">Department</th>
                        <th className="py-2.5 px-3">Total Strength</th>
                        <th className="py-2.5 px-3">Placed Count</th>
                        <th className="py-2.5 px-3">Placement rate</th>
                        <th className="py-2.5 px-3">Avg CTC</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getDepartmentSummary().map((d, idx) => (
                        <tr key={idx} className="border-b border-slate-100 dark:border-slate-800/40">
                          <td className="py-3 px-3 font-bold">{d.department}</td>
                          <td className="py-3 px-3">{d.totalStudents}</td>
                          <td className="py-3 px-3 font-semibold text-primary-600 dark:text-primary-400">{d.placedStudents}</td>
                          <td className="py-3 px-3 font-extrabold text-emerald-500">{d.placementRate}</td>
                          <td className="py-3 px-3 font-semibold">{d.averagePackage}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2 p-3.5 rounded-2xl bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 text-xs mt-6">
            <Info size={16} className="shrink-0" />
            <span>Click Export or Print options on the left to save these analytical tables permanently.</span>
          </div>
        </div>

      </div>
    </div>
  );
};
export default Reports;
