import React, { useState, useEffect } from "react";
import { dbService } from "../services/firebase";
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  X, 
  Upload, 
  Check, 
  AlertTriangle,
  Users,
  Eye,
  GraduationCap
} from "lucide-react";

export const Students = () => {
  const [students, setStudents] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDept, setFilterDept] = useState("All");
  const [filterYear, setFilterYear] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Form State
  const [formState, setFormState] = useState({
    name: "",
    registerNumber: "",
    department: "CSE",
    yearOfStudy: "4th Year",
    cgpa: 7.0,
    skills: "",
    certifications: "",
    internshipExperience: 0,
    aptitudeScore: 60,
    communicationScore: 60,
    placementStatus: "Unplaced",
    selectedCompany: "",
    offerType: "",
    package: 0
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const studList = await dbService.getStudents();
      const compList = await dbService.getCompanies();
      setStudents(studList);
      setCompanies(compList);
    } catch (err) {
      setError("Failed to fetch student details. " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showSuccessMessage = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 3000);
  };

  const handleOpenAddModal = () => {
    setEditingStudent(null);
    setFormState({
      name: "",
      registerNumber: "",
      department: "CSE",
      yearOfStudy: "4th Year",
      cgpa: 7.5,
      skills: "C++, Python, SQL",
      certifications: "AWS Certified",
      internshipExperience: 0,
      aptitudeScore: 70,
      communicationScore: 70,
      placementStatus: "Unplaced",
      selectedCompany: "",
      offerType: "",
      package: 0
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (student) => {
    setEditingStudent(student);
    setFormState({
      ...student,
      skills: student.skills ? student.skills.join(", ") : "",
      certifications: student.certifications ? student.certifications.join(", ") : ""
    });
    setIsModalOpen(true);
  };

  const handleOpenDetailsModal = (student) => {
    setSelectedStudent(student);
    setIsDetailsOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this student record?")) {
      try {
        await dbService.deleteStudent(id);
        setStudents(students.filter(s => s.id !== id));
        showSuccessMessage("Student record deleted successfully.");
      } catch (err) {
        setError("Failed to delete student: " + err.message);
      }
    }
  };

  const handleDeleteAllStudents = async () => {
    if (students.length === 0) return;
    if (!window.confirm("Delete all student records? This cannot be undone.")) return;

    try {
      await dbService.deleteAllStudents();
      setStudents([]);
      showSuccessMessage("All student records have been deleted.");
    } catch (err) {
      setError("Failed to delete all students: " + err.message);
    }
  };

  const handleStatusChange = (e) => {
    const status = e.target.value;
    let updateObj = { placementStatus: status };
    if (status === "Unplaced") {
      updateObj.selectedCompany = "";
      updateObj.offerType = "";
      updateObj.package = 0;
    } else if (status === "Interned") {
      updateObj.offerType = "Internship";
      updateObj.package = 0;
    } else if (status === "Placed") {
      updateObj.offerType = "Full-Time";
    }
    setFormState({ ...formState, ...updateObj });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!/^\d+$/.test(formState.registerNumber)) {
      setError("Register number must contain digits only.");
      return;
    }

    try {
      const skillsArray = formState.skills
        ? formState.skills.split(",").map(s => s.trim()).filter(Boolean)
        : [];
      const certsArray = formState.certifications
        ? formState.certifications.split(",").map(s => s.trim()).filter(Boolean)
        : [];

      const payload = {
        ...formState,
        cgpa: Number(formState.cgpa),
        internshipExperience: Number(formState.internshipExperience),
        aptitudeScore: Number(formState.aptitudeScore),
        communicationScore: Number(formState.communicationScore),
        package: formState.placementStatus === "Placed" ? Number(formState.package) : 0,
        skills: skillsArray,
        certifications: certsArray
      };

      if (editingStudent) {
        payload.id = editingStudent.id;
        await dbService.saveStudent(payload);
        showSuccessMessage("Student updated successfully.");
      } else {
        await dbService.saveStudent(payload);
        showSuccessMessage("Student created successfully.");
      }

      setIsModalOpen(false);
      loadData();
    } catch (err) {
      setError("Failed to save student: " + err.message);
    }
  };

  const parseCsvLine = (line) => {
    const values = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        const nextChar = line[i + 1];
        if (inQuotes && nextChar === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        values.push(current);
        current = "";
      } else {
        current += char;
      }
    }

    values.push(current);
    return values;
  };

  // Bulk CSV Import parser
  const handleCsvUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setError("");
    setLoading(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target.result;
        const rows = text.split(/\r?\n/).map(r => r.trim()).filter(Boolean);
        if (rows.length <= 1) {
          setError("CSV file is empty or missing headers.");
          setLoading(false);
          return;
        }

        // Headers check: name, registerNumber, department, yearOfStudy, cgpa, skills, certifications, internshipExperience, aptitudeScore, communicationScore, placementStatus
        const headers = parseCsvLine(rows[0]).map(h => h.trim().replace(/^['"]|['"]$/g, ""));
        const studentsToUpload = [];

        for (let i = 1; i < rows.length; i++) {
          const rowValues = parseCsvLine(rows[i]).map(v => v.trim().replace(/^['"]|['"]$/g, ""));
          if (rowValues.length < headers.length) continue;

          const rowObj = {};
          headers.forEach((header, index) => {
            rowObj[header] = rowValues[index] || "";
          });

          const skills = rowObj.skills ? rowObj.skills.split(";").map(s => s.trim()).filter(Boolean) : [];
          const certifications = rowObj.certifications ? rowObj.certifications.split(";").map(c => c.trim()).filter(Boolean) : [];

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

        if (studentsToUpload.length === 0) {
          setError("No valid student rows found. Please check the CSV headers and data format.");
          setLoading(false);
          return;
        }

        await Promise.all(studentsToUpload.map(stud => dbService.saveStudent(stud)));
        showSuccessMessage(`Successfully imported ${studentsToUpload.length} students!`);
        await loadData();
      } catch (err) {
        setError("Error parsing CSV data. Make sure it follows proper column names: " + err.message);
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  // Filter & Search Logic
  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.registerNumber.includes(searchQuery);
    
    const matchesDept = filterDept === "All" || s.department === filterDept;
    const matchesYear = filterYear === "All" || s.yearOfStudy === filterYear;
    const matchesStatus = filterStatus === "All" || s.placementStatus === filterStatus;

    return matchesSearch && matchesDept && matchesYear && matchesStatus;
  });

  // Pagination calculation
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredStudents.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="space-y-6 slide-in">
      {/* Action Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h2 className="text-xl font-bold">Students Directory</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Track academic scoring, tech competencies, and employment offers.</p>
        </div>

        <div className="flex items-center space-x-3">
          {/* CSV File Input */}
          <label className="flex items-center justify-center space-x-1.5 px-3 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl cursor-pointer text-xs font-semibold transition-colors">
            <Upload size={16} />
            <span>CSV Bulk Import</span>
            <input
              type="file"
              accept=".csv"
              onChange={handleCsvUpload}
              className="hidden"
            />
          </label>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center justify-center space-x-1.5 px-4 py-2 rounded-xl bg-primary-600 text-white hover:bg-primary-500 font-semibold text-xs shadow-lg shadow-primary-500/25 transition-all active:scale-[0.98]"
          >
            <Plus size={16} />
            <span>Add Student</span>
          </button>

          <button
            onClick={handleDeleteAllStudents}
            disabled={students.length === 0}
            className="flex items-center justify-center space-x-1.5 px-4 py-2 rounded-xl bg-rose-600 text-white hover:bg-rose-500 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-xs shadow-lg shadow-rose-500/20 transition-all active:scale-[0.98]"
          >
            <Trash2 size={16} />
            <span>Delete All</span>
          </button>
        </div>
      </div>

      {success && (
        <div className="flex items-center space-x-2 p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-900/50 text-emerald-400 text-xs">
          <Check size={16} />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center space-x-2 p-3.5 rounded-xl bg-rose-950/30 border border-rose-900/50 text-rose-400 text-xs">
          <AlertTriangle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search controls */}
      <div className="glass-card p-4 rounded-2xl flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Search by student name or register number..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="w-full py-2 pl-9 pr-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs focus:outline-none focus:border-primary-500 transition-colors"
          />
        </div>

        {/* Triple Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-1.5">
            <span className="text-[10px] uppercase font-bold text-slate-400">Department</span>
            <select
              value={filterDept}
              onChange={(e) => { setFilterDept(e.target.value); setCurrentPage(1); }}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none"
            >
              <option value="All">All Depts</option>
              <option value="CSE">CSE</option>
              <option value="IT">IT</option>
              <option value="ECE">ECE</option>
              <option value="EEE">EEE</option>
              <option value="MECH">MECH</option>
              <option value="AI-DS">AI-DS</option>
              <option value="AI-ML">AI-ML</option>
            </select>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="text-[10px] uppercase font-bold text-slate-400">Year</span>
            <select
              value={filterYear}
              onChange={(e) => { setFilterYear(e.target.value); setCurrentPage(1); }}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none"
            >
              <option value="All">All Years</option>
              <option value="3rd Year">3rd Year</option>
              <option value="4th Year">4th Year</option>
            </select>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="text-[10px] uppercase font-bold text-slate-400">Status</span>
            <select
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none"
            >
              <option value="All">All Status</option>
              <option value="Unplaced">Unplaced</option>
              <option value="Interned">Interned</option>
              <option value="Placed">Placed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Students Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        {loading ? (
          <div className="py-20 flex justify-center">
            <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="py-20 text-center text-slate-500 dark:text-slate-400">
            <Users size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm font-semibold">No students found matching filters.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider bg-slate-50/50 dark:bg-slate-900/30">
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Register Num</th>
                    <th className="py-3 px-4">Department & Year</th>
                    <th className="py-3 px-4">CGPA Score</th>
                    <th className="py-3 px-4">Skills count</th>
                    <th className="py-3 px-4">Placement Status</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((stud) => (
                    <tr key={stud.id} className="border-b border-slate-100 dark:border-slate-800/40 hover:bg-slate-50/40 dark:hover:bg-slate-800/10">
                      <td className="py-4 px-4">
                        <p className="font-bold text-slate-900 dark:text-white text-sm">{stud.name}</p>
                      </td>
                      <td className="py-4 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-400">{stud.registerNumber}</td>
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-slate-300">{stud.department}</p>
                          <p className="text-[10px] text-slate-400">{stud.yearOfStudy}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-bold text-slate-800 dark:text-slate-300">{stud.cgpa.toFixed(2)}</td>
                      <td className="py-4 px-4">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold text-[10px]">
                          {stud.skills ? stud.skills.length : 0} Skills
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        {stud.placementStatus === "Placed" ? (
                          <div>
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400">
                              Placed Full-time
                            </span>
                            <p className="text-[10px] font-semibold mt-1 truncate max-w-[120px]" title={stud.selectedCompany}>
                              {stud.selectedCompany} ({stud.package} LPA)
                            </p>
                          </div>
                        ) : stud.placementStatus === "Interned" ? (
                          <div>
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-sky-100 text-sky-700 dark:bg-sky-950/20 dark:text-sky-400">
                              Intern Offer
                            </span>
                            <p className="text-[10px] font-semibold mt-1 truncate max-w-[120px]">
                              {stud.selectedCompany}
                            </p>
                          </div>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                            Unplaced
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => handleOpenDetailsModal(stud)}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
                            title="View Details"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(stud)}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
                            title="Edit"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(stud.id)}
                            className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900/30 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 dark:text-rose-400 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-slate-200 dark:border-slate-800 text-xs">
                <span className="text-slate-500">
                  Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredStudents.length)} of {filteredStudents.length} students
                </span>
                <div className="flex space-x-1">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40"
                  >
                    Previous
                  </button>
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`px-2.5 py-1 rounded border ${
                        currentPage === i + 1 
                          ? "bg-primary-600 text-white border-primary-600" 
                          : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* CRUD Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <form 
            onSubmit={handleSubmit} 
            className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col slide-in relative"
            style={{ maxHeight: '85vh' }}
          >
            {/* Modal Header */}
            <div className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800/60 shrink-0">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="absolute top-6 right-6 p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X size={16} />
              </button>

              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                {editingStudent ? "Modify Student Profile" : "Register Student Record"}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Enter academic metrics, performance evaluations, skills, and placement offers.
              </p>
            </div>

            {/* Scrollable Form Fields */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0">
              {/* Row 1 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Student Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Aditya Sharma"
                    value={formState.name}
                    onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                    className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:border-primary-500 focus:outline-none text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">University Register Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., 312221104001"
                    value={formState.registerNumber}
                    disabled={!!editingStudent}
                    onChange={(e) => setFormState({ ...formState, registerNumber: e.target.value })}
                    className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:border-primary-500 focus:outline-none text-xs disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Department</label>
                  <select
                    value={formState.department}
                    onChange={(e) => setFormState({ ...formState, department: e.target.value })}
                    className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:border-primary-500 focus:outline-none text-xs"
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
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Year of Study</label>
                  <select
                    value={formState.yearOfStudy}
                    onChange={(e) => setFormState({ ...formState, yearOfStudy: e.target.value })}
                    className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:border-primary-500 focus:outline-none text-xs"
                  >
                    <option value="3rd Year">3rd Year (Junior)</option>
                    <option value="4th Year">4th Year (Senior)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">CGPA (out of 10.0)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    required
                    value={formState.cgpa}
                    onChange={(e) => setFormState({ ...formState, cgpa: e.target.value })}
                    className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:border-primary-500 focus:outline-none text-xs"
                  />
                </div>
              </div>

              {/* Row 3: ML Predictor scores */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Aptitude Score (0-100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formState.aptitudeScore}
                    onChange={(e) => setFormState({ ...formState, aptitudeScore: e.target.value })}
                    className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:border-primary-500 focus:outline-none text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Communication Score (0-100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formState.communicationScore}
                    onChange={(e) => setFormState({ ...formState, communicationScore: e.target.value })}
                    className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:border-primary-500 focus:outline-none text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Prior Internships count</label>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    value={formState.internshipExperience}
                    onChange={(e) => setFormState({ ...formState, internshipExperience: e.target.value })}
                    className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:border-primary-500 focus:outline-none text-xs"
                  />
                </div>
              </div>

              {/* Skills and Certifications */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Technical Skills (Comma separated)</label>
                  <input
                    type="text"
                    placeholder="React, Java, SQL, Python"
                    value={formState.skills}
                    onChange={(e) => setFormState({ ...formState, skills: e.target.value })}
                    className="w-full py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:border-primary-500 focus:outline-none text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Certifications (Comma separated)</label>
                  <input
                    type="text"
                    placeholder="AWS Practitioner, CCNA"
                    value={formState.certifications}
                    onChange={(e) => setFormState({ ...formState, certifications: e.target.value })}
                    className="w-full py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:border-primary-500 focus:outline-none text-xs"
                  />
                </div>
              </div>

              {/* Placement Details */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Placement Status</label>
                    <select
                      value={formState.placementStatus}
                      onChange={handleStatusChange}
                      className="w-full py-2 px-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs focus:outline-none"
                    >
                      <option value="Unplaced">Unplaced</option>
                      <option value="Interned">Interned (Internship Offer)</option>
                      <option value="Placed">Placed (Full-Time Job)</option>
                    </select>
                  </div>

                  {formState.placementStatus !== "Unplaced" && (
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Recruiting Company</label>
                      <select
                        value={formState.selectedCompany}
                        onChange={(e) => setFormState({ ...formState, selectedCompany: e.target.value })}
                        className="w-full py-2 px-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs focus:outline-none"
                      >
                        <option value="">-- Choose Company --</option>
                        {companies.map(c => (
                          <option key={c.id} value={c.companyName}>{c.companyName} - {c.role}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {formState.placementStatus === "Placed" && (
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Salary Package (LPA)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={formState.package}
                      onChange={(e) => setFormState({ ...formState, package: e.target.value })}
                      className="w-full py-2 px-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs focus:outline-none"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-3 bg-slate-50/50 dark:bg-slate-950/20 rounded-b-3xl shrink-0">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-primary-600 text-white hover:bg-primary-500 text-xs font-semibold shadow-lg shadow-primary-500/10"
              >
                {editingStudent ? "Save Changes" : "Register Student"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Detail Viewer Modal */}
      {isDetailsOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div 
            className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col slide-in relative"
            style={{ maxHeight: '85vh' }}
          >
            
            {/* Modal Header */}
            <div className="p-6 pb-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => setIsDetailsOpen(false)}
                className="absolute top-6 right-6 p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X size={16} />
              </button>

              {/* Profile Info Header */}
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary-600 to-indigo-600 text-white font-extrabold flex items-center justify-center text-xl shadow-lg shrink-0">
                  {selectedStudent.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{selectedStudent.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Reg Num: {selectedStudent.registerNumber}</p>
                </div>
              </div>
            </div>

            {/* Scrollable Content Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/40 dark:border-slate-800/40">
                  <span className="text-[9px] uppercase font-semibold text-slate-400">Department</span>
                  <p className="text-sm font-bold mt-0.5 text-slate-800 dark:text-slate-200">{selectedStudent.department}</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/40 dark:border-slate-800/40">
                  <span className="text-[9px] uppercase font-semibold text-slate-400">CGPA</span>
                  <p className="text-sm font-bold mt-0.5 text-slate-800 dark:text-slate-200">{selectedStudent.cgpa.toFixed(2)}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/40 dark:border-slate-800/40 text-center">
                  <span className="text-[9px] uppercase font-semibold text-slate-400">Aptitude</span>
                  <p className="text-sm font-bold mt-0.5 text-slate-800 dark:text-slate-200">{selectedStudent.aptitudeScore}%</p>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/40 dark:border-slate-800/40 text-center">
                  <span className="text-[9px] uppercase font-semibold text-slate-400">Comm Score</span>
                  <p className="text-sm font-bold mt-0.5 text-slate-800 dark:text-slate-200">{selectedStudent.communicationScore}%</p>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/40 dark:border-slate-800/40 text-center">
                  <span className="text-[9px] uppercase font-semibold text-slate-400">Internships</span>
                  <p className="text-sm font-bold mt-0.5 text-slate-800 dark:text-slate-200">{selectedStudent.internshipExperience}</p>
                </div>
              </div>

              {/* Skills Tags */}
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1.5">Acquired Technical Skills</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedStudent.skills && selectedStudent.skills.length > 0 ? (
                    selectedStudent.skills.map((skill, idx) => (
                      <span key={idx} className="px-2.5 py-0.5 rounded-lg bg-primary-50 dark:bg-primary-950/20 text-primary-600 dark:text-primary-400 text-xs font-semibold">
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500">None declared</span>
                  )}
                </div>
              </div>

              {/* Certifications Tags */}
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1.5">Industry Certifications</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedStudent.certifications && selectedStudent.certifications.length > 0 ? (
                    selectedStudent.certifications.map((cert, idx) => (
                      <span key={idx} className="px-2.5 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                        {cert}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500">None declared</span>
                  )}
                </div>
              </div>

              {/* Placements Details card */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40">
                <span className="text-[9px] uppercase font-semibold text-slate-400 block mb-2">Employment Offer Details</span>
                {selectedStudent.placementStatus === "Placed" ? (
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Company: <span className="text-primary-600 dark:text-primary-400">{selectedStudent.selectedCompany}</span>
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Offer Type: Full-Time Placement Job
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Annual Package: <span className="font-bold">{selectedStudent.package} LPA</span>
                    </p>
                  </div>
                ) : selectedStudent.placementStatus === "Interned" ? (
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Company: <span className="text-sky-600 dark:text-sky-400">{selectedStudent.selectedCompany}</span>
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Offer Type: Internship Opportunity
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 font-semibold italic">Currently looking for opportunities (Unplaced)</p>
                )}
              </div>
            </div>

            {/* Footer with a simple Close Button */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800/60 flex justify-end bg-slate-50/50 dark:bg-slate-950/20 rounded-b-3xl shrink-0">
              <button
                type="button"
                onClick={() => setIsDetailsOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default Students;
