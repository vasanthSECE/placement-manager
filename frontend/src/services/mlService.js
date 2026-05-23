import axios from "axios";
import { mockDb } from "./mockDb";

const getMlUrl = () => {
  const settings = mockDb.getSettings();
  return settings.mlEndpoint || "http://localhost:5000";
};

// Client-side fallback prediction models (when ML backend is offline)
const fallbackPredictPlacement = (data) => {
  const cgpa = parseFloat(data.cgpa || 7.0);
  const aptitude = parseInt(data.aptitudeScore || 60);
  const communication = parseInt(data.communicationScore || 60);
  const internships = parseInt(data.internshipExperience || 0);
  
  const certsRaw = data.certifications || 0;
  const certsCount = Array.isArray(certsRaw) ? certsRaw.length : parseInt(certsRaw);
  
  const skillsRaw = data.skills || [];
  const skillsCount = Array.isArray(skillsRaw) ? skillsRaw.length : parseInt(skillsRaw);
  
  // Calculate basic linear model approximation
  const gpaFactor = (cgpa - 5.0) * 14; // max 70
  const aptitudeFactor = (aptitude - 40) * 0.25; // max 15
  const commFactor = (communication - 40) * 0.25; // max 15
  const internFactor = internships * 10; // max 30
  const certsFactor = certsCount * 4;
  const skillsFactor = skillsCount * 2;
  
  const baseProb = gpaFactor + aptitudeFactor + commFactor + internFactor + certsFactor + skillsFactor;
  const finalProb = Math.min(99.2, Math.max(10.5, baseProb));
  return {
    success: true,
    placementProbability: parseFloat(finalProb.toFixed(1)),
    isFallback: true,
    inputs: { cgpa, aptitudeScore: aptitude, communicationScore: communication, internshipExperience: internships, certificationsCount: certsCount, skillsCount }
  };
};

const fallbackPredictSalary = (data) => {
  const cgpa = parseFloat(data.cgpa || 7.0);
  const internships = parseInt(data.internshipExperience || 0);
  
  const certsRaw = data.certifications || 0;
  const certsCount = Array.isArray(certsRaw) ? certsRaw.length : parseInt(certsRaw);
  
  const skillsRaw = data.skills || [];
  const skillsCount = Array.isArray(skillsRaw) ? skillsRaw.length : parseInt(skillsRaw);
  
  const val = 3.5 + (cgpa - 5.5) * 1.25 + internships * 1.6 + certsCount * 0.6 + skillsCount * 0.35;
  const salary = Math.min(45.0, Math.max(3.0, val));
  return {
    success: true,
    expectedSalary: parseFloat(salary.toFixed(2)),
    isFallback: true,
    inputs: { cgpa, internshipExperience: internships, certificationsCount: certsCount, skillsCount }
  };
};

export const mlService = {
  // Check if Flask server is online
  checkHealth: async () => {
    try {
      const response = await axios.get(`${getMlUrl()}/health`, { timeout: 1500 });
      return { online: true, ...response.data };
    } catch (e) {
      return { online: false, error: e.message };
    }
  },

  predictPlacement: async (studentData) => {
    try {
      const url = `${getMlUrl()}/predict-placement`;
      const response = await axios.post(url, studentData, { timeout: 3000 });
      return response.data;
    } catch (error) {
      console.warn("ML API Placement Predictor failed or is offline. Using local simulation model:", error.message);
      return fallbackPredictPlacement(studentData);
    }
  },

  predictSalary: async (studentData) => {
    try {
      const url = `${getMlUrl()}/predict-salary`;
      const response = await axios.post(url, studentData, { timeout: 3000 });
      return response.data;
    } catch (error) {
      console.warn("ML API Salary Predictor failed or is offline. Using local simulation model:", error.message);
      return fallbackPredictSalary(studentData);
    }
  },

  recommendCompanies: async (studentProfile, companiesList = []) => {
    try {
      const url = `${getMlUrl()}/recommend-companies`;
      const payload = {
        cgpa: studentProfile.cgpa,
        department: studentProfile.department,
        skills: studentProfile.skills,
        companies: companiesList
      };
      const response = await axios.post(url, payload, { timeout: 3000 });
      return response.data;
    } catch (error) {
      console.warn("ML API Recruiter Recommender failed or is offline. Running recommendation client-side:", error.message);
      // Run local recommendation calculations
      const student_cgpa = parseFloat(studentProfile.cgpa || 7.0);
      const student_dept = studentProfile.department || "CSE";
      const student_skills = (studentProfile.skills || []).map(s => s.trim().lower());
      
      const targetCompanies = companiesList.length > 0 ? companiesList : await mockDb.getCompanies();
      
      const recommendations = targetCompanies.map(company => {
        const req_cgpa = parseFloat(company.minimumCGPA || 6.0);
        const eligible_depts = company.eligibleDepartments || [];
        const req_skills = (company.skillsRequired || []).map(s => s.trim().lower());
        
        let cgpa_score = 0;
        if (student_cgpa >= req_cgpa) {
          cgpa_score = 35;
        } else {
          cgpa_score = Math.max(0, 35 - (req_cgpa - student_cgpa) * 40);
        }
        
        const dept_score = eligible_depts.includes(student_dept) ? 30 : 5;
        
        let skills_matched = 0;
        req_skills.forEach(skill => {
          if (student_skills.some(s => s.includes(skill) || skill.includes(s))) {
            skills_matched++;
          }
        });
        
        const skills_score = req_skills.length ? (skills_matched / req_skills.length) * 35 : 35;
        const match_percentage = Math.min(100.0, Math.max(0.0, cgpa_score + dept_score + skills_score));
        
        const eligibility = student_cgpa >= req_cgpa && eligible_depts.includes(student_dept);
        
        return {
          companyName: company.companyName,
          role: company.role,
          package: company.package,
          stipend: company.stipend,
          offerType: company.offerType,
          matchPercentage: parseFloat(match_percentage.toFixed(1)),
          isEligible: eligibility,
          cgpaEligible: student_cgpa >= req_cgpa,
          deptEligible: eligible_depts.includes(student_dept),
          skillsMatched: skills_matched,
          totalSkillsRequired: req_skills.length,
          recommendingReason: eligibility && skills_matched > 1 
            ? `Matches eligibility constraints and covers ${skills_matched}/${req_skills.length} core technical requirements.`
            : eligibility 
            ? "Meets academic criteria. Focus on learning required skills to boost matching."
            : "Under-eligible for this role (CGPA or department restriction)."
        };
      });
      
      recommendations.sort((a, b) => b.matchPercentage - a.matchPercentage);
      
      return {
        success: true,
        recommendations,
        isFallback: true
      };
    }
  },

  analyzeSkillGap: async (studentSkills, companySkills) => {
    try {
      const url = `${getMlUrl()}/skill-gap-analysis`;
      const payload = {
        studentSkills,
        companySkills
      };
      const response = await axios.post(url, payload, { timeout: 3000 });
      return response.data;
    } catch (error) {
      console.warn("ML API Skill Gap Analyzer failed or is offline. Executing client-side mapping:", error.message);
      
      const suggestions_db = {
        "data structures": "Study arrays, trees, heaps, and graph algorithms on platforms like LeetCode or GeeksforGeeks.",
        "algorithms": "Practice sorting, binary search, recursion, dynamic programming, and greedy algorithms.",
        "react": "Build SPA applications using Hooks, Context API, Redux/Zustand, and routing.",
        "python": "Learn OOP, basic data science libs (pandas/numpy), file I/O, and REST frameworks like Flask/FastAPI.",
        "java": "Master core Java OOP concepts, multithreading, collections framework, and JDBC database connections.",
        "sql": "Learn SQL queries, complex joins, indexing, normalization, subqueries, and transaction management.",
        "aws": "Understand EC2, S3, RDS, IAM, Lambda, VPC, and deployment patterns. Study for AWS Certified Cloud Practitioner.",
        "javascript": "Understand ES6+ features, asynchronous programming (Promises/async-await), DOM, and events.",
        "machine learning": "Study supervised/unsupervised learning models, evaluation metrics, and scikit-learn/pandas/numpy.",
        "c++": "Master Object-Oriented Programming (OOP) in C++, memory management (pointers), and STL containers.",
        "autocad": "Practice 2D drafting and 3D modeling. Learn layer management, dimensions, and drawing scale.",
        "matlab": "Practice matrix operations, script writing, numerical simulation, and control systems modeling."
      };
      
      const missingSkills = [];
      const improvementSuggestions = [];
      const recommendedLearningPaths = [];
      
      const student_skills_clean = studentSkills.map(s => s.trim().lower());
      
      companySkills.forEach(c_skill => {
        const c_skill_clean = c_skill.trim().lower();
        const has_skill = student_skills_clean.some(s_skill => s_skill.includes(c_skill_clean) || c_skill_clean.includes(s_skill));
        
        if (!has_skill) {
          missingSkills.append ? missingSkills.push(c_skill) : missingSkills.push(c_skill);
          
          let suggestion_made = false;
          for (const [key, text] of Object.entries(suggestions_db)) {
            if (c_skill_clean.includes(key) || key.includes(c_skill_clean)) {
              improvementSuggestions.push(`For ${c_skill}: ${text}`);
              recommendedLearningPaths.push(`${c_skill} path: Learn on Coursera/Udemy/Youtube and build a portfolio project.`);
              suggestion_made = true;
              break;
            }
          }
          
          if (!suggestion_made) {
            improvementSuggestions.push(`For ${c_skill}: Study core concepts, practice writing code, and read official documentations.`);
            recommendedLearningPaths.push(`${c_skill} path: Find standard online tutorials and complete introductory projects.`);
          }
        }
      });
      
      return {
        success: true,
        missingSkills,
        improvementSuggestions,
        recommendedLearningPaths,
        skillsMatchCount: companySkills.length - missingSkills.length,
        totalCompanySkills: companySkills.length,
        isFallback: true
      };
    }
  }
};
export default mlService;
