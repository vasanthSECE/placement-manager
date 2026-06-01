// Simulated Local Storage Database
// Pre-populated with realistic placement analytics data

const INITIAL_COMPANIES = [
  {
    id: "comp-1",
    companyName: "Google",
    role: "Software Engineer",
    offerType: "Both",
    stipend: 100000,
    package: 28.5,
    visitDate: "2025-09-10",
    eligibleDepartments: ["CSE", "IT", "ECE"],
    minimumCGPA: 8.5,
    internshipCount: 2,
    fullTimeCount: 4,
    totalSelected: 6,
    year: 2025,
    skillsRequired: ["Data Structures", "Algorithms", "Python", "System Design"],
    createdAt: new Date("2025-09-10").toISOString()
  },
  {
    id: "comp-2",
    companyName: "Microsoft",
    role: "Software Engineer Intern",
    offerType: "Internship",
    stipend: 80000,
    package: 0,
    visitDate: "2025-10-05",
    eligibleDepartments: ["CSE", "IT", "ECE", "EEE"],
    minimumCGPA: 8.0,
    internshipCount: 5,
    fullTimeCount: 0,
    totalSelected: 5,
    year: 2025,
    skillsRequired: ["Data Structures", "Algorithms", "C++", "React"],
    createdAt: new Date("2025-10-05").toISOString()
  },
  {
    id: "comp-3",
    companyName: "TCS",
    role: "Ninja Developer",
    offerType: "Full-Time",
    stipend: 0,
    package: 4.5,
    visitDate: "2025-11-20",
    eligibleDepartments: ["CSE", "IT", "ECE", "EEE", "MECH", "AI-DS", "AI-ML"],
    minimumCGPA: 6.0,
    internshipCount: 0,
    fullTimeCount: 18,
    totalSelected: 18,
    year: 2025,
    skillsRequired: ["Java", "C++", "SQL", "HTML"],
    createdAt: new Date("2025-11-20").toISOString()
  },
  {
    id: "comp-4",
    companyName: "Infosys",
    role: "Systems Engineer",
    offerType: "Full-Time",
    stipend: 0,
    package: 4.0,
    visitDate: "2025-11-15",
    eligibleDepartments: ["CSE", "IT", "ECE", "EEE", "MECH", "AI-DS", "AI-ML"],
    minimumCGPA: 6.0,
    internshipCount: 0,
    fullTimeCount: 12,
    totalSelected: 12,
    year: 2025,
    skillsRequired: ["Python", "Java", "SQL", "Web Development"],
    createdAt: new Date("2025-11-15").toISOString()
  },
  {
    id: "comp-5",
    companyName: "Accenture",
    role: "Application Developer",
    offerType: "Both",
    stipend: 25000,
    package: 6.5,
    visitDate: "2025-10-18",
    eligibleDepartments: ["CSE", "IT", "ECE", "EEE", "MECH"],
    minimumCGPA: 6.5,
    internshipCount: 4,
    fullTimeCount: 8,
    totalSelected: 12,
    year: 2025,
    skillsRequired: ["JavaScript", "Cloud Computing", "SQL", "Agile"],
    createdAt: new Date("2025-10-18").toISOString()
  },
  {
    id: "comp-6",
    companyName: "Amazon",
    role: "Cloud Support Associate",
    offerType: "Full-Time",
    stipend: 0,
    package: 12.0,
    visitDate: "2025-08-25",
    eligibleDepartments: ["CSE", "IT", "ECE", "EEE"],
    minimumCGPA: 7.5,
    internshipCount: 0,
    fullTimeCount: 4,
    totalSelected: 4,
    year: 2025,
    skillsRequired: ["Linux", "Networking", "AWS", "Python"],
    createdAt: new Date("2025-08-25").toISOString()
  },
  {
    id: "comp-7",
    companyName: "NVIDIA",
    role: "Hardware Engineer",
    offerType: "Full-Time",
    stipend: 0,
    package: 22.0,
    visitDate: "2025-09-05",
    eligibleDepartments: ["ECE", "EEE", "CSE"],
    minimumCGPA: 8.2,
    internshipCount: 0,
    fullTimeCount: 3,
    totalSelected: 3,
    year: 2025,
    skillsRequired: ["Verilog", "VLSI", "C++", "Computer Architecture"],
    createdAt: new Date("2025-09-05").toISOString()
  },
  {
    id: "comp-8",
    companyName: "L&T Tech Services",
    role: "Graduate Engineer Trainee",
    offerType: "Full-Time",
    stipend: 0,
    package: 5.0,
    visitDate: "2025-12-02",
    eligibleDepartments: ["MECH", "AI-DS", "AI-ML", "EEE", "ECE"],
    minimumCGPA: 6.5,
    internshipCount: 0,
    fullTimeCount: 8,
    totalSelected: 8,
    year: 2025,
    skillsRequired: ["AutoCAD", "MATLAB", "C", "Project Management"],
    createdAt: new Date("2025-12-02").toISOString()
  },
  {
    id: "comp-9",
    companyName: "Cognizant",
    role: "Programmer Analyst",
    offerType: "Full-Time",
    stipend: 0,
    package: 4.2,
    visitDate: "2026-02-15",
    eligibleDepartments: ["CSE", "IT", "ECE", "EEE", "MECH"],
    minimumCGPA: 6.0,
    internshipCount: 0,
    fullTimeCount: 15,
    totalSelected: 15,
    year: 2026,
    skillsRequired: ["Java", "SQL", "JavaScript", "Python"],
    createdAt: new Date("2026-02-15").toISOString()
  },
  {
    id: "comp-10",
    companyName: "Salesforce",
    role: "Member Technical Staff",
    offerType: "Both",
    stipend: 75000,
    package: 18.5,
    visitDate: "2026-01-20",
    eligibleDepartments: ["CSE", "IT", "ECE"],
    minimumCGPA: 8.0,
    internshipCount: 3,
    fullTimeCount: 5,
    totalSelected: 8,
    year: 2026,
    skillsRequired: ["Data Structures", "Algorithms", "Java", "React", "Cloud Computing"],
    createdAt: new Date("2026-01-20").toISOString()
  }
];

const INITIAL_STUDENTS = [
  {
    id: "stud-1",
    name: "Aditya Sharma",
    registerNumber: "312221104001",
    department: "CSE",
    yearOfStudy: "4th Year",
    cgpa: 9.12,
    skills: ["Data Structures", "Algorithms", "React", "Node.js", "Python"],
    certifications: ["AWS Cloud Practitioner", "Google Data Analytics"],
    internshipExperience: 2,
    aptitudeScore: 92,
    communicationScore: 88,
    placementStatus: "Placed",
    selectedCompany: "Google",
    offerType: "Full-Time",
    package: 28.5,
    createdAt: new Date("2025-05-15").toISOString()
  },
  {
    id: "stud-2",
    name: "Priyanka Sen",
    registerNumber: "312221104002",
    department: "CSE",
    yearOfStudy: "4th Year",
    cgpa: 8.85,
    skills: ["Data Structures", "Algorithms", "Java", "React", "SQL"],
    certifications: ["React Developer Certificate"],
    internshipExperience: 1,
    aptitudeScore: 85,
    communicationScore: 94,
    placementStatus: "Placed",
    selectedCompany: "Microsoft",
    offerType: "Full-Time",
    package: 18.0,
    createdAt: new Date("2025-05-15").toISOString()
  },
  {
    id: "stud-3",
    name: "Rahul Verma",
    registerNumber: "312221106012",
    department: "ECE",
    yearOfStudy: "4th Year",
    cgpa: 8.45,
    skills: ["Verilog", "VLSI", "C++", "Python", "Linux"],
    certifications: ["Embedded Systems Certification"],
    internshipExperience: 1,
    aptitudeScore: 82,
    communicationScore: 80,
    placementStatus: "Placed",
    selectedCompany: "NVIDIA",
    offerType: "Full-Time",
    package: 22.0,
    createdAt: new Date("2025-05-15").toISOString()
  },
  {
    id: "stud-4",
    name: "Sneha Patel",
    registerNumber: "312221104045",
    department: "CSE",
    yearOfStudy: "4th Year",
    cgpa: 7.95,
    skills: ["Python", "Machine Learning", "SQL", "Tableau"],
    certifications: ["TensorFlow Developer"],
    internshipExperience: 0,
    aptitudeScore: 78,
    communicationScore: 85,
    placementStatus: "Placed",
    selectedCompany: "Amazon",
    offerType: "Full-Time",
    package: 12.0,
    createdAt: new Date("2025-05-15").toISOString()
  },
  {
    id: "stud-5",
    name: "Vikram Malhotra",
    registerNumber: "312221114008",
    department: "MECH",
    yearOfStudy: "4th Year",
    cgpa: 7.42,
    skills: ["AutoCAD", "SolidWorks", "MATLAB", "C"],
    certifications: ["SolidWorks Associate"],
    internshipExperience: 1,
    aptitudeScore: 70,
    communicationScore: 75,
    placementStatus: "Placed",
    selectedCompany: "L&T Tech Services",
    offerType: "Full-Time",
    package: 5.0,
    createdAt: new Date("2025-05-15").toISOString()
  },
  {
    id: "stud-6",
    name: "Ananya Iyer",
    registerNumber: "312221205003",
    department: "IT",
    yearOfStudy: "4th Year",
    cgpa: 8.21,
    skills: ["JavaScript", "React", "Node.js", "MongoDB", "SQL"],
    certifications: ["MongoDB Associate"],
    internshipExperience: 2,
    aptitudeScore: 80,
    communicationScore: 90,
    placementStatus: "Placed",
    selectedCompany: "Accenture",
    offerType: "Both",
    package: 6.5,
    createdAt: new Date("2025-05-15").toISOString()
  },
  {
    id: "stud-7",
    name: "Rohan Das",
    registerNumber: "312221104033",
    department: "CSE",
    yearOfStudy: "4th Year",
    cgpa: 6.85,
    skills: ["Java", "SQL", "HTML", "CSS", "JavaScript"],
    certifications: ["Oracle Java Certified"],
    internshipExperience: 0,
    aptitudeScore: 68,
    communicationScore: 72,
    placementStatus: "Placed",
    selectedCompany: "TCS",
    offerType: "Full-Time",
    package: 4.5,
    createdAt: new Date("2025-05-15").toISOString()
  },
  {
    id: "stud-8",
    name: "Karan Johar",
    registerNumber: "312221105021",
    department: "EEE",
    yearOfStudy: "4th Year",
    cgpa: 7.15,
    skills: ["MATLAB", "PLC", "C++", "Power Systems"],
    certifications: ["Automation Systems Professional"],
    internshipExperience: 0,
    aptitudeScore: 75,
    communicationScore: 70,
    placementStatus: "Placed",
    selectedCompany: "Infosys",
    offerType: "Full-Time",
    package: 4.0,
    createdAt: new Date("2025-05-15").toISOString()
  },
  {
    id: "stud-9",
    name: "Amit Kumar",
    registerNumber: "312222104005",
    department: "CSE",
    yearOfStudy: "3rd Year",
    cgpa: 9.45,
    skills: ["Data Structures", "Algorithms", "C++", "Python", "React"],
    certifications: ["Google Cloud Associate"],
    internshipExperience: 1,
    aptitudeScore: 95,
    communicationScore: 88,
    placementStatus: "Interned",
    selectedCompany: "Microsoft",
    offerType: "Internship",
    package: 0, // Stipend is handled via company
    createdAt: new Date("2025-05-15").toISOString()
  },
  {
    id: "stud-10",
    name: "Neha Gupta",
    registerNumber: "312222104018",
    department: "CSE",
    yearOfStudy: "3rd Year",
    cgpa: 8.60,
    skills: ["JavaScript", "React", "Node.js", "SQL", "Git"],
    certifications: [],
    internshipExperience: 1,
    aptitudeScore: 84,
    communicationScore: 86,
    placementStatus: "Interned",
    selectedCompany: "Salesforce",
    offerType: "Internship",
    package: 0,
    createdAt: new Date("2025-05-15").toISOString()
  },
  {
    id: "stud-11",
    name: "Siddharth Roy",
    registerNumber: "312222205041",
    department: "IT",
    yearOfStudy: "3rd Year",
    cgpa: 8.10,
    skills: ["Java", "Spring Boot", "SQL", "JavaScript", "Docker"],
    certifications: ["Docker Certified Associate"],
    internshipExperience: 1,
    aptitudeScore: 82,
    communicationScore: 78,
    placementStatus: "Unplaced",
    selectedCompany: "",
    offerType: "",
    package: 0,
    createdAt: new Date("2025-05-15").toISOString()
  },
  {
    id: "stud-12",
    name: "Riya Sen",
    registerNumber: "312222106030",
    department: "ECE",
    yearOfStudy: "3rd Year",
    cgpa: 7.82,
    skills: ["Python", "MATLAB", "Arduino", "IoT", "C"],
    certifications: ["Introduction to IoT"],
    internshipExperience: 0,
    aptitudeScore: 74,
    communicationScore: 88,
    placementStatus: "Unplaced",
    selectedCompany: "",
    offerType: "",
    package: 0,
    createdAt: new Date("2025-05-15").toISOString()
  },
  {
    id: "stud-13",
    name: "Varun Dhawan",
    registerNumber: "312221114023",
    department: "MECH",
    yearOfStudy: "4th Year",
    cgpa: 6.90,
    skills: ["AutoCAD", "Ansys", "Manufacturing", "C"],
    certifications: [],
    internshipExperience: 0,
    aptitudeScore: 66,
    communicationScore: 68,
    placementStatus: "Placed",
    selectedCompany: "L&T Tech Services",
    offerType: "Full-Time",
    package: 5.0,
    createdAt: new Date("2025-05-15").toISOString()
  },
  {
    id: "stud-14",
    name: "Kriti Sanon",
    registerNumber: "312221103014",
    department: "AI-DS",
    yearOfStudy: "4th Year",
    cgpa: 7.20,
    skills: ["Python", "SQL", "Tableau", "Power BI", "Excel"],
    certifications: ["Google Data Analytics Professional"],
    internshipExperience: 1,
    aptitudeScore: 72,
    communicationScore: 82,
    placementStatus: "Placed",
    selectedCompany: "TCS",
    offerType: "Full-Time",
    package: 4.5,
    createdAt: new Date("2025-05-15").toISOString()
  },
  {
    id: "stud-15",
    name: "Deepak Chahar",
    registerNumber: "312221105007",
    department: "EEE",
    yearOfStudy: "4th Year",
    cgpa: 8.05,
    skills: ["Power Electronics", "MATLAB", "C++", "Microcontrollers"],
    certifications: [],
    internshipExperience: 1,
    aptitudeScore: 88,
    communicationScore: 74,
    placementStatus: "Placed",
    selectedCompany: "Accenture",
    offerType: "Full-Time",
    package: 6.5,
    createdAt: new Date("2025-05-15").toISOString()
  },
  {
    id: "stud-16",
    name: "Ishita Bhalla",
    registerNumber: "312222104022",
    department: "CSE",
    yearOfStudy: "3rd Year",
    cgpa: 8.92,
    skills: ["Data Structures", "Algorithms", "Python", "Django", "SQL"],
    certifications: ["Python Developer Specialization"],
    internshipExperience: 1,
    aptitudeScore: 90,
    communicationScore: 92,
    placementStatus: "Interned",
    selectedCompany: "Google",
    offerType: "Internship",
    package: 0,
    createdAt: new Date("2025-05-15").toISOString()
  },
  {
    id: "stud-17",
    name: "Madhavan Swamy",
    registerNumber: "312221104019",
    department: "CSE",
    yearOfStudy: "4th Year",
    cgpa: 6.20,
    skills: ["HTML", "CSS", "SQL", "Manual Testing"],
    certifications: [],
    internshipExperience: 0,
    aptitudeScore: 54,
    communicationScore: 60,
    placementStatus: "Unplaced",
    selectedCompany: "",
    offerType: "",
    package: 0,
    createdAt: new Date("2025-05-15").toISOString()
  },
  {
    id: "stud-18",
    name: "Manish Pandey",
    registerNumber: "312221106024",
    department: "ECE",
    yearOfStudy: "4th Year",
    cgpa: 7.34,
    skills: ["Digital Electronics", "VHDL", "C", "Python"],
    certifications: [],
    internshipExperience: 0,
    aptitudeScore: 72,
    communicationScore: 70,
    placementStatus: "Placed",
    selectedCompany: "Infosys",
    offerType: "Full-Time",
    package: 4.0,
    createdAt: new Date("2025-05-15").toISOString()
  },
  {
    id: "stud-19",
    name: "Divya Prakash",
    registerNumber: "312222205011",
    department: "IT",
    yearOfStudy: "3rd Year",
    cgpa: 7.55,
    skills: ["Web Development", "PHP", "MySQL", "JavaScript"],
    certifications: [],
    internshipExperience: 0,
    aptitudeScore: 68,
    communicationScore: 78,
    placementStatus: "Unplaced",
    selectedCompany: "",
    offerType: "",
    package: 0,
    createdAt: new Date("2025-05-15").toISOString()
  },
  {
    id: "stud-20",
    name: "Jasprit Bumrah",
    registerNumber: "312221114015",
    department: "MECH",
    yearOfStudy: "4th Year",
    cgpa: 8.50,
    skills: ["Thermodynamics", "AutoCAD", "MATLAB", "R", "Excel"],
    certifications: ["Certified SolidWorks Professional"],
    internshipExperience: 2,
    aptitudeScore: 84,
    communicationScore: 76,
    placementStatus: "Placed",
    selectedCompany: "Accenture",
    offerType: "Full-Time",
    package: 6.5,
    createdAt: new Date("2025-05-15").toISOString()
  }
];

// Helper to save to localStorage
const save = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// Helper to fetch from localStorage
const fetch = (key) => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : null;
};

// Init DB
export const initMockDb = (force = false) => {
  if (force || !localStorage.getItem("placement_db_initialized")) {
    save("companies", INITIAL_COMPANIES);
    save("students", INITIAL_STUDENTS);
    localStorage.setItem("placement_db_initialized", "true");
    
    // Add default custom settings
    save("app_settings", {
      mlEndpoint: "http://localhost:5000",
      useFirebase: false, // fallback mode
      theme: "dark"
    });
    
    console.log("Mock Database initialized successfully.");
  }
};

// Run automatically when imported
initMockDb();

export const mockDb = {
  // --- COMPANIES CRUD ---
  getCompanies: async () => {
    await new Promise(resolve => setTimeout(resolve, 300)); // simulate delay
    return fetch("companies") || [];
  },
  
  saveCompany: async (company) => {
    await new Promise(resolve => setTimeout(resolve, 400));
    const companies = fetch("companies") || [];
    if (company.id) {
      // Edit
      const index = companies.findIndex(c => c.id === company.id);
      if (index !== -1) {
        companies[index] = { ...companies[index], ...company };
      }
    } else {
      // Add
      const newCompany = {
        ...company,
        id: "comp-" + Math.random().toString(36).substr(2, 9),
        createdAt: new Date().toISOString()
      };
      companies.push(newCompany);
    }
    save("companies", companies);
    return true;
  },
  
  deleteCompany: async (id) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    let companies = fetch("companies") || [];
    companies = companies.filter(c => c.id !== id);
    save("companies", companies);
    return true;
  },

  deleteAllCompanies: async () => {
    await new Promise(resolve => setTimeout(resolve, 300));
    save("companies", []);
    return true;
  },

  // --- STUDENTS CRUD ---
  getStudents: async () => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return fetch("students") || [];
  },
  
  saveStudent: async (student) => {
    await new Promise(resolve => setTimeout(resolve, 400));
    const students = fetch("students") || [];
    if (student.id) {
      // Edit
      const index = students.findIndex(s => s.id === student.id);
      if (index !== -1) {
        students[index] = { ...students[index], ...student };
      }
    } else {
      // Add
      const newStudent = {
        ...student,
        id: "stud-" + Math.random().toString(36).substr(2, 9),
        createdAt: new Date().toISOString()
      };
      students.push(newStudent);
    }
    save("students", students);
    return true;
  },
  
  deleteStudent: async (id) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    let students = fetch("students") || [];
    students = students.filter(s => s.id !== id);
    save("students", students);
    return true;
  },

  deleteAllStudents: async () => {
    await new Promise(resolve => setTimeout(resolve, 300));
    save("students", []);
    return true;
  },

  // --- ANALYTICS calculations ---
  getAnalytics: async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const students = fetch("students") || [];
    const companies = fetch("companies") || [];

    const totalCompanies = companies.length;
    const totalPlaced = students.filter(s => s.placementStatus === "Placed").length;
    const totalInternship = students.filter(s => s.placementStatus === "Interned").length;
    const totalOffers = students.filter(s => s.placementStatus === "Placed" || s.placementStatus === "Interned").length;

    // Package metrics
    const placedWithPackages = students.filter(s => s.placementStatus === "Placed" && s.package > 0);
    const packages = placedWithPackages.map(s => s.package);
    const highestPackage = packages.length ? Math.max(...packages) : 0;
    const averagePackage = packages.length ? packages.reduce((a, b) => a + b, 0) / packages.length : 0;

    // Placement percentage (for 4th years, who are graduating/seeking full placement)
    const fourthYears = students.filter(s => s.yearOfStudy === "4th Year");
    const fourthYearsPlaced = fourthYears.filter(s => s.placementStatus === "Placed").length;
    const placementPercentage = fourthYears.length ? (fourthYearsPlaced / fourthYears.length) * 100 : 0;

    // Department-wise stats
    const departments = ["CSE", "IT", "ECE", "EEE", "MECH", "AI-DS", "AI-ML"];
    const deptStats = departments.map(dept => {
      const deptStudents = students.filter(s => s.department === dept);
      const deptPlaced = deptStudents.filter(s => s.placementStatus === "Placed" || s.placementStatus === "Interned").length;
      return {
        name: dept,
        total: deptStudents.length,
        placed: deptPlaced,
        percentage: deptStudents.length ? Math.round((deptPlaced / deptStudents.length) * 100) : 0
      };
    });

    // Year-wise stats (2024, 2025, 2026)
    // We can simulate trends
    const yearWiseTrends = [
      { year: 2024, placementRate: 72.5, highestPackage: 24.0, averagePackage: 5.2, companies: 45 },
      { year: 2025, placementRate: 80.0, highestPackage: 28.5, averagePackage: 5.8, companies: 52 },
      { year: 2026, placementRate: 85.0, highestPackage: 32.0, averagePackage: 6.4, companies: 58 }
    ];

    // Top Recruiters
    const recruiterCounts = {};
    students.forEach(s => {
      if (s.selectedCompany && (s.placementStatus === "Placed" || s.placementStatus === "Interned")) {
        recruiterCounts[s.selectedCompany] = (recruiterCounts[s.selectedCompany] || 0) + 1;
      }
    });
    const topRecruiters = Object.entries(recruiterCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Monthly hiring trends (simulated for the academic cycle: Jul - Apr)
    const monthlyTrends = [
      { month: "Jul", interns: 5, fullTime: 2 },
      { month: "Aug", interns: 8, fullTime: 6 },
      { month: "Sep", interns: 12, fullTime: 18 },
      { month: "Oct", interns: 15, fullTime: 22 },
      { month: "Nov", interns: 6, fullTime: 28 },
      { month: "Dec", interns: 4, fullTime: 10 },
      { month: "Jan", interns: 10, fullTime: 12 },
      { month: "Feb", interns: 12, fullTime: 15 },
      { month: "Mar", interns: 8, fullTime: 8 },
      { month: "Apr", interns: 2, fullTime: 4 }
    ];

    // Recruiter activity
    const recruiterActivity = companies.map(c => ({
      name: c.companyName,
      package: c.package,
      hiredCount: c.totalSelected,
      visitDate: c.visitDate
    })).sort((a, b) => b.hiredCount - a.hiredCount).slice(0, 8);

    return {
      kpis: {
        totalCompanies,
        totalPlaced,
        totalInternshipOffers: totalInternship,
        totalFullTimeOffers: students.filter(s => s.offerType === "Full-Time").length,
        highestPackage: highestPackage.toFixed(1),
        averagePackage: averagePackage.toFixed(2),
        placementPercentage: Math.round(placementPercentage)
      },
      deptStats,
      yearWiseTrends,
      topRecruiters,
      monthlyTrends,
      recruiterActivity
    };
  },

  // --- SETTINGS CRUD ---
  getSettings: () => {
    return fetch("app_settings") || { mlEndpoint: "http://localhost:5000", useFirebase: false, theme: "dark" };
  },
  
  saveSettings: (settings) => {
    const current = fetch("app_settings") || {};
    save("app_settings", { ...current, ...settings });
    return true;
  },
  
  resetDb: () => {
    initMockDb(true);
    return true;
  }
};
