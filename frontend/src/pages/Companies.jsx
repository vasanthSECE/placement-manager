import React, { useState, useEffect } from "react";
import { dbService } from "../services/firebase";
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  X, 
  Briefcase, 
  Check, 
  AlertTriangle 
} from "lucide-react";

export const Companies = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterOfferType, setFilterOfferType] = useState("All");
  const [filterYear, setFilterYear] = useState("All");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);

  // Form State
  const [formState, setFormState] = useState({
    companyName: "",
    role: "",
    offerType: "Full-Time",
    stipend: 0,
    package: 0,
    visitDate: "",
    eligibleDepartments: [],
    minimumCGPA: 6.0,
    internshipCount: 0,
    fullTimeCount: 0,
    totalSelected: 0,
    year: new Date().getFullYear(),
    skillsRequired: ""
  });

  const availableDepts = ["CSE", "IT", "ECE", "EEE", "MECH", "CIVIL"];

  const loadCompanies = async () => {
    setLoading(true);
    try {
      const list = await dbService.getCompanies();
      setCompanies(list);
    } catch (err) {
      setError("Failed to fetch companies. " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompanies();
  }, []);

  const showSuccessMessage = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 3000);
  };

  const handleOpenAddModal = () => {
    setEditingCompany(null);
    setFormState({
      companyName: "",
      role: "",
      offerType: "Full-Time",
      stipend: 0,
      package: 0,
      visitDate: new Date().toISOString().split("T")[0],
      eligibleDepartments: ["CSE"],
      minimumCGPA: 6.5,
      internshipCount: 0,
      fullTimeCount: 0,
      totalSelected: 0,
      year: new Date().getFullYear(),
      skillsRequired: ""
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (company) => {
    setEditingCompany(company);
    setFormState({
      ...company,
      skillsRequired: company.skillsRequired ? company.skillsRequired.join(", ") : ""
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this company visit record?")) {
      try {
        await dbService.deleteCompany(id);
        setCompanies(companies.filter(c => c.id !== id));
        showSuccessMessage("Company record deleted successfully.");
      } catch (err) {
        setError("Failed to delete company. " + err.message);
      }
    }
  };

  const handleDeleteAllCompanies = async () => {
    if (companies.length === 0) return;
    if (!window.confirm("Are you sure you want to delete all company visits? This action cannot be undone.")) return;

    try {
      await dbService.deleteAllCompanies();
      setCompanies([]);
      showSuccessMessage("All company visit records have been deleted.");
    } catch (err) {
      setError("Failed to delete all companies. " + err.message);
    }
  };

  const handleDeptCheckbox = (dept) => {
    const currentDepts = [...formState.eligibleDepartments];
    if (currentDepts.includes(dept)) {
      setFormState({
        ...formState,
        eligibleDepartments: currentDepts.filter(d => d !== dept)
      });
    } else {
      setFormState({
        ...formState,
        eligibleDepartments: [...currentDepts, dept]
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    // Validations
    if (formState.eligibleDepartments.length === 0) {
      setError("Please select at least one eligible department.");
      return;
    }

    try {
      const skillsArray = formState.skillsRequired
        ? formState.skillsRequired.split(",").map(s => s.trim()).filter(Boolean)
        : [];
      
      const payload = {
        ...formState,
        stipend: Number(formState.stipend),
        package: Number(formState.package),
        minimumCGPA: Number(formState.minimumCGPA),
        internshipCount: Number(formState.internshipCount),
        fullTimeCount: Number(formState.fullTimeCount),
        totalSelected: Number(formState.internshipCount) + Number(formState.fullTimeCount),
        year: Number(formState.year),
        skillsRequired: skillsArray
      };

      if (editingCompany) {
        payload.id = editingCompany.id;
        await dbService.saveCompany(payload);
        showSuccessMessage("Company updated successfully.");
      } else {
        await dbService.saveCompany(payload);
        showSuccessMessage("Company created successfully.");
      }
      
      setIsModalOpen(false);
      loadCompanies();
    } catch (err) {
      setError("Failed to save company: " + err.message);
    }
  };

  // Filter & Search Logic
  const filteredCompanies = companies.filter(c => {
    const matchesSearch = c.companyName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.role.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesOffer = filterOfferType === "All" || c.offerType === filterOfferType;
    const matchesYear = filterYear === "All" || c.year.toString() === filterYear;
    
    return matchesSearch && matchesOffer && matchesYear;
  });

  // Pagination calculation
  const totalPages = Math.ceil(filteredCompanies.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredCompanies.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="space-y-6 slide-in">
      {/* Top action block */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-xl font-bold">Company Visits List</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Manage schedules, eligibility, and offers for recruiters.</p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3">
          <button
            onClick={handleOpenAddModal}
            className="flex items-center justify-center space-x-1.5 px-4 py-2 rounded-xl bg-primary-600 text-white hover:bg-primary-500 font-semibold text-xs shadow-lg shadow-primary-500/25 transition-all active:scale-[0.98]"
          >
            <Plus size={16} />
            <span>Add Company Drive</span>
          </button>
          <button
            onClick={handleDeleteAllCompanies}
            disabled={companies.length === 0}
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

      {/* Filter and Search Bar */}
      <div className="glass-card p-4 rounded-2xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Search by company name or profile role..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="w-full py-2 pl-9 pr-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs focus:outline-none focus:border-primary-500 transition-colors"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5">
            <span className="text-[10px] uppercase font-bold text-slate-400">Offer Type</span>
            <select
              value={filterOfferType}
              onChange={(e) => { setFilterOfferType(e.target.value); setCurrentPage(1); }}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none"
            >
              <option value="All">All Types</option>
              <option value="Internship">Internship</option>
              <option value="Full-Time">Full-Time</option>
              <option value="Both">Both</option>
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
              <option value="2025">2025</option>
              <option value="2026">2026</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Companies Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        {loading ? (
          <div className="py-20 flex justify-center">
            <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredCompanies.length === 0 ? (
          <div className="py-20 text-center text-slate-500 dark:text-slate-400">
            <Briefcase size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm font-semibold">No companies found matching search criteria.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider bg-slate-50/50 dark:bg-slate-900/30">
                    <th className="py-3 px-4">Company Details</th>
                    <th className="py-3 px-4">Offer & Package</th>
                    <th className="py-3 px-4">Visit Date & Batch</th>
                    <th className="py-3 px-4">Eligible Departments</th>
                    <th className="py-3 px-4">Min GPA</th>
                    <th className="py-3 px-4">Selections</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((comp) => (
                    <tr key={comp.id} className="border-b border-slate-100 dark:border-slate-800/40 hover:bg-slate-50/40 dark:hover:bg-slate-800/10">
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white text-sm">{comp.companyName}</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{comp.role}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            comp.offerType === "Internship" 
                              ? "bg-sky-100 text-sky-700 dark:bg-sky-950/20 dark:text-sky-400" 
                              : comp.offerType === "Full-Time" 
                              ? "bg-purple-100 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400" 
                              : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400"
                          }`}>
                            {comp.offerType}
                          </span>
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-300 mt-1">
                            {comp.package > 0 ? `${comp.package} LPA` : ""}
                            {comp.stipend > 0 ? ` / ₹${comp.stipend.toLocaleString()}/mo` : ""}
                          </p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-slate-300">{comp.visitDate}</p>
                          <p className="text-[10px] text-slate-400">Batch of {comp.year}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-wrap gap-1">
                          {comp.eligibleDepartments.map((dept) => (
                            <span key={dept} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-medium">
                              {dept}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-4 px-4 font-semibold text-slate-800 dark:text-slate-300">{comp.minimumCGPA.toFixed(2)}</td>
                      <td className="py-4 px-4">
                        <div className="text-[11px]">
                          <p className="text-slate-800 dark:text-slate-300 font-semibold">{comp.totalSelected} Total</p>
                          <p className="text-[9px] text-slate-400">
                            {comp.internshipCount} Int | {comp.fullTimeCount} FT
                          </p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => handleOpenEditModal(comp)}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
                            title="Edit"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(comp.id)}
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

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-slate-200 dark:border-slate-800 text-xs">
                <span className="text-slate-500">
                  Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredCompanies.length)} of {filteredCompanies.length} companies
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

      {/* CRUD Add/Edit Modal */}
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
                {editingCompany ? "Modify Recruitment Drive" : "Schedule New Visiting Recruiter"}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Enter recruiter parameters, eligibility criteria, and technical skills demanded.
              </p>
            </div>

            {error && (
              <div className="mx-6 mt-4 flex items-center space-x-2 p-3 rounded-xl bg-rose-950/30 border border-rose-900/50 text-rose-400 text-xs shrink-0">
                <AlertTriangle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Scrollable Form Fields */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0">
              {/* Row 1 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Company Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Google"
                    value={formState.companyName}
                    onChange={(e) => setFormState({ ...formState, companyName: e.target.value })}
                    className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:border-primary-500 focus:outline-none text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Job Role</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Software Engineering Trainee"
                    value={formState.role}
                    onChange={(e) => setFormState({ ...formState, role: e.target.value })}
                    className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:border-primary-500 focus:outline-none text-xs"
                  />
                </div>
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Offer Type</label>
                  <select
                    value={formState.offerType}
                    onChange={(e) => setFormState({ ...formState, offerType: e.target.value })}
                    className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:border-primary-500 focus:outline-none text-xs"
                  >
                    <option value="Internship">Internship</option>
                    <option value="Full-Time">Full-Time</option>
                    <option value="Both">Both</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Stipend (Monthly)</label>
                  <input
                    type="number"
                    min="0"
                    value={formState.stipend}
                    onChange={(e) => setFormState({ ...formState, stipend: e.target.value })}
                    className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:border-primary-500 focus:outline-none text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Full-time Package (LPA)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={formState.package}
                    onChange={(e) => setFormState({ ...formState, package: e.target.value })}
                    className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:border-primary-500 focus:outline-none text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Batch Year</label>
                  <input
                    type="number"
                    required
                    value={formState.year}
                    onChange={(e) => setFormState({ ...formState, year: e.target.value })}
                    className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:border-primary-500 focus:outline-none text-xs"
                  />
                </div>
              </div>

              {/* Row 3 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Visit Date</label>
                  <input
                    type="date"
                    required
                    value={formState.visitDate}
                    onChange={(e) => setFormState({ ...formState, visitDate: e.target.value })}
                    className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:border-primary-500 focus:outline-none text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Minimum CGPA Criteria</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    required
                    value={formState.minimumCGPA}
                    onChange={(e) => setFormState({ ...formState, minimumCGPA: e.target.value })}
                    className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:border-primary-500 focus:outline-none text-xs"
                  />
                </div>
              </div>

              {/* Row 4: Offer Counters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Internships Hired</label>
                  <input
                    type="number"
                    min="0"
                    value={formState.internshipCount}
                    onChange={(e) => setFormState({ ...formState, internshipCount: e.target.value })}
                    className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:border-primary-500 focus:outline-none text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Full-time Roles Hired</label>
                  <input
                    type="number"
                    min="0"
                    value={formState.fullTimeCount}
                    onChange={(e) => setFormState({ ...formState, fullTimeCount: e.target.value })}
                    className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:border-primary-500 focus:outline-none text-xs"
                  />
                </div>
              </div>

              {/* Eligible Departments */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-2">Eligible Departments</label>
                <div className="flex flex-wrap gap-4 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40">
                  {availableDepts.map(dept => (
                    <label key={dept} className="flex items-center space-x-2 text-xs font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formState.eligibleDepartments.includes(dept)}
                        onChange={() => handleDeptCheckbox(dept)}
                        className="rounded text-primary-600 focus:ring-primary-500 w-4 h-4"
                      />
                      <span>{dept}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Required Skills */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Required Skills (Comma separated)</label>
                <textarea
                  placeholder="e.g., React, Java, Data Structures, Algorithms, SQL"
                  value={formState.skillsRequired}
                  onChange={(e) => setFormState({ ...formState, skillsRequired: e.target.value })}
                  rows="2"
                  className="w-full py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 focus:border-primary-500 focus:outline-none text-xs resize-none"
                />
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
                {editingCompany ? "Save Changes" : "Create Record"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
export default Companies;
