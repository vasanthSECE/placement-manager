import os
import joblib
import pandas as pd
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable Cross-Origin Resource Sharing for all origins

# Path settings
PLACEMENT_MODEL_PATH = "models/placement_model.joblib"
SALARY_MODEL_PATH = "models/salary_model.joblib"

# Load models at startup, train if missing
placement_model = None
salary_model = None

def load_models():
    global placement_model, salary_model
    if not os.path.exists(PLACEMENT_MODEL_PATH) or not os.path.exists(SALARY_MODEL_PATH):
        print("Model files not found. Auto-training models now...")
        try:
            from train_models import train_and_save_models
            train_and_save_models()
        except Exception as e:
            print(f"Error training models programmatically: {e}")
            
    try:
        if os.path.exists(PLACEMENT_MODEL_PATH):
            placement_model = joblib.load(PLACEMENT_MODEL_PATH)
            print("Successfully loaded placement prediction model.")
        if os.path.exists(SALARY_MODEL_PATH):
            salary_model = joblib.load(SALARY_MODEL_PATH)
            print("Successfully loaded salary prediction model.")
    except Exception as e:
        print(f"Error loading model files: {e}")

# Call load_models at start
load_models()

# Fallback models in case of loading issues
def mock_predict_placement(cgpa, aptitude, communication, internships, certs, skills_count):
    # Simple mathematical approximation of placement probability
    score = (cgpa - 5.0) * 12 + (aptitude - 40) * 0.3 + (communication - 40) * 0.3 + internships * 10 + certs * 4 + skills_count * 2
    probability = np.clip(score, 10, 98)
    return float(probability)

def mock_predict_salary(cgpa, internships, certs, skills_count):
    # Simple mathematical approximation of expected salary
    val = 3.2 + (cgpa - 5.5) * 1.1 + internships * 1.5 + certs * 0.5 + skills_count * 0.25
    salary = np.clip(val, 3.0, 36.0)
    return float(round(salary, 2))


@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "healthy",
        "models_loaded": {
            "placement": placement_model is not None,
            "salary": salary_model is not None
        }
    })


@app.route("/predict-placement", methods=["POST"])
def predict_placement():
    try:
        data = request.json or {}
        
        cgpa = float(data.get("cgpa", 7.0))
        aptitude_score = int(data.get("aptitudeScore", 60))
        communication_score = int(data.get("communicationScore", 60))
        internships = int(data.get("internshipExperience", 0))
        
        # Handle list or integer inputs for certifications and skills
        certs_raw = data.get("certifications", 0)
        certs = len(certs_raw) if isinstance(certs_raw, list) else int(certs_raw)
        
        skills_raw = data.get("skills", [])
        skills_count = len(skills_raw) if isinstance(skills_raw, list) else int(skills_raw)
        
        department = data.get("department", "CSE")
        
        if placement_model is not None:
            # Prepare input dataframe
            input_df = pd.DataFrame([{
                "cgpa": cgpa,
                "aptitudeScore": aptitude_score,
                "communicationScore": communication_score,
                "internshipExperience": internships,
                "certifications": certs,
                "skillsCount": skills_count,
                "department": department
            }])
            
            # Predict probability
            # placement_model is a pipeline: ColumnTransformer + LogisticRegression
            probabilities = placement_model.predict_proba(input_df)[0]
            # Probabilities is [prob_unplaced, prob_placed]
            placement_prob = float(probabilities[1]) * 100
        else:
            placement_prob = mock_predict_placement(cgpa, aptitude_score, communication_score, internships, certs, skills_count)
            
        return jsonify({
            "success": True,
            "placementProbability": round(placement_prob, 1),
            "inputs": {
                "cgpa": cgpa,
                "aptitudeScore": aptitude_score,
                "communicationScore": communication_score,
                "internshipExperience": internships,
                "certificationsCount": certs,
                "skillsCount": skills_count,
                "department": department
            }
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400


@app.route("/predict-salary", methods=["POST"])
def predict_salary():
    try:
        data = request.json or {}
        
        cgpa = float(data.get("cgpa", 7.0))
        internships = int(data.get("internshipExperience", 0))
        
        certs_raw = data.get("certifications", 0)
        certs = len(certs_raw) if isinstance(certs_raw, list) else int(certs_raw)
        
        skills_raw = data.get("skills", [])
        skills_count = len(skills_raw) if isinstance(skills_raw, list) else int(skills_raw)
        
        if salary_model is not None:
            input_df = pd.DataFrame([{
                "cgpa": cgpa,
                "internshipExperience": internships,
                "skillsCount": skills_count,
                "certifications": certs
            }])
            salary_pred = float(salary_model.predict(input_df)[0])
        else:
            salary_pred = mock_predict_salary(cgpa, internships, certs, skills_count)
            
        return jsonify({
            "success": True,
            "expectedSalary": round(salary_pred, 2),
            "inputs": {
                "cgpa": cgpa,
                "internshipExperience": internships,
                "certificationsCount": certs,
                "skillsCount": skills_count
            }
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400


@app.route("/recommend-companies", methods=["POST"])
def recommend_companies():
    try:
        data = request.json or {}
        
        student_cgpa = float(data.get("cgpa", 7.0))
        student_dept = data.get("department", "CSE")
        student_skills = [s.strip().lower() for s in data.get("skills", []) if isinstance(s, str)]
        
        # We can accept a list of companies to match against, or use defaults
        companies = data.get("companies", [])
        
        # Default list of popular tech companies and requirements if none provided
        if not companies:
            companies = [
                {
                    "companyName": "Google",
                    "role": "Software Engineer",
                    "minimumCGPA": 8.5,
                    "eligibleDepartments": ["CSE", "IT", "ECE"],
                    "skillsRequired": ["Data Structures", "Algorithms", "Python", "System Design"],
                    "package": 28.0
                },
                {
                    "companyName": "Microsoft",
                    "role": "Software Engineering Intern",
                    "minimumCGPA": 8.0,
                    "eligibleDepartments": ["CSE", "IT", "ECE", "EEE"],
                    "skillsRequired": ["Data Structures", "Algorithms", "C++", "React"],
                    "package": 18.0
                },
                {
                    "companyName": "Tata Consultancy Services (TCS)",
                    "role": "Ninja Developer",
                    "minimumCGPA": 6.0,
                    "eligibleDepartments": ["CSE", "IT", "ECE", "EEE", "MECH", "CIVIL"],
                    "skillsRequired": ["Java", "C++", "SQL", "HTML"],
                    "package": 4.5
                },
                {
                    "companyName": "Infosys",
                    "role": "Systems Engineer",
                    "minimumCGPA": 6.0,
                    "eligibleDepartments": ["CSE", "IT", "ECE", "EEE", "MECH", "CIVIL"],
                    "skillsRequired": ["Python", "Java", "SQL", "Web Development"],
                    "package": 4.0
                },
                {
                    "companyName": "Accenture",
                    "role": "Application Development Analyst",
                    "minimumCGPA": 6.5,
                    "eligibleDepartments": ["CSE", "IT", "ECE", "EEE", "MECH"],
                    "skillsRequired": ["JavaScript", "Cloud Computing", "SQL", "Agile"],
                    "package": 6.5
                },
                {
                    "companyName": "Amazon",
                    "role": "Cloud Support Associate",
                    "minimumCGPA": 7.5,
                    "eligibleDepartments": ["CSE", "IT", "ECE", "EEE"],
                    "skillsRequired": ["Linux", "Networking", "AWS", "Python"],
                    "package": 12.0
                },
                {
                    "companyName": "NVIDIA",
                    "role": "Hardware Engineer",
                    "minimumCGPA": 8.2,
                    "eligibleDepartments": ["ECE", "EEE", "CSE"],
                    "skillsRequired": ["Verilog", "VLSI", "C++", "Computer Architecture"],
                    "package": 22.0
                },
                {
                    "companyName": "L&T Technology Services",
                    "role": "Graduate Engineer Trainee",
                    "minimumCGPA": 6.5,
                    "eligibleDepartments": ["MECH", "CIVIL", "EEE", "ECE"],
                    "skillsRequired": ["AutoCAD", "MATLAB", "C", "Project Management"],
                    "package": 5.0
                }
            ]
            
        recommendations = []
        for company in companies:
            req_cgpa = float(company.get("minimumCGPA", 6.0))
            eligible_depts = company.get("eligibleDepartments", [])
            req_skills = [s.strip().lower() for s in company.get("skillsRequired", [])]
            
            # Match score components
            cgpa_score = 0
            if student_cgpa >= req_cgpa:
                cgpa_score = 35
            else:
                cgpa_score = max(0, 35 - (req_cgpa - student_cgpa) * 40)  # Penalize based on distance
                
            dept_score = 30 if student_dept in eligible_depts else 5
            
            # Skill match
            skills_match_count = 0
            for skill in req_skills:
                # Direct check or substring check
                if any(skill in s or s in skill for s in student_skills):
                    skills_match_count += 1
            
            skills_score = 0
            if req_skills:
                skills_score = (skills_match_count / len(req_skills)) * 35
            else:
                skills_score = 35
                
            total_match_score = cgpa_score + dept_score + skills_score
            match_percentage = min(100.0, max(0.0, total_match_score))
            
            # Detailed breakdown
            eligibility = student_cgpa >= req_cgpa and student_dept in eligible_depts
            
            recommendations.append({
                "companyName": company.get("companyName"),
                "role": company.get("role"),
                "package": company.get("package", 0.0),
                "stipend": company.get("stipend", 0),
                "offerType": company.get("offerType", "Full-Time"),
                "matchPercentage": round(match_percentage, 1),
                "isEligible": eligibility,
                "cgpaEligible": student_cgpa >= req_cgpa,
                "deptEligible": student_dept in eligible_depts,
                "skillsMatched": skills_match_count,
                "totalSkillsRequired": len(req_skills),
                "recommendingReason": (
                    f"Strong skill match ({skills_match_count}/{len(req_skills)}) and meets GPA requirements."
                    if eligibility and skills_match_count > 1 else
                    "Meets basic eligibility parameters, but has some skill gaps."
                    if eligibility else
                    "Does not meet eligibility (GPA or Department constraint)."
                )
            })
            
        # Sort recommendations by match percentage descending
        recommendations.sort(key=lambda x: x["matchPercentage"], reverse=True)
        
        return jsonify({
            "success": True,
            "recommendations": recommendations
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400


@app.route("/skill-gap-analysis", methods=["POST"])
def skill_gap_analysis():
    try:
        data = request.json or {}
        
        student_skills = [s.strip().lower() for s in data.get("studentSkills", []) if isinstance(s, str)]
        company_skills_raw = data.get("companySkills", [])
        
        # Standard suggestions database
        suggestions_db = {
            "data structures": {
                "suggest": "Study arrays, trees, heaps, and graph algorithms on platforms like LeetCode or GeeksforGeeks.",
                "path": "Coursera's 'Data Structures and Algorithms' Specialization by UC San Diego"
            },
            "algorithms": {
                "suggest": "Practice sorting, binary search, recursion, dynamic programming, and greedy algorithms.",
                "path": "MIT OpenCourseWare 6.006 'Introduction to Algorithms' or LeetCode Top Interview 150."
            },
            "react": {
                "suggest": "Build SPA applications using Hooks, Context API, Redux/Zustand, and routing.",
                "path": "React Official Docs (react.dev) or Udemy's 'React - The Complete Guide' by Academind."
            },
            "python": {
                "suggest": "Learn OOP, basic data science libs (pandas/numpy), file I/O, and REST frameworks like Flask/FastAPI.",
                "path": "Coursera's 'Python for Everybody' by University of Michigan."
            },
            "java": {
                "suggest": "Master core Java OOP concepts, multithreading, collections framework, and JDBC database connections.",
                "path": "Oracle Java Tutorials or Udemy's 'Java Programming Masterclass'."
            },
            "sql": {
                "suggest": "Learn SQL queries, complex joins, indexing, normalization, subqueries, and transaction management.",
                "path": "SQLZoo, Mode Analytics SQL Tutorial, or Codecademy SQL course."
            },
            "aws": {
                "suggest": "Understand EC2, S3, RDS, IAM, Lambda, VPC, and deployment patterns. Study for AWS Certified Cloud Practitioner.",
                "path": "AWS Skill Builder courses or Stephane Maarek's AWS Developer course on Udemy."
            },
            "javascript": {
                "suggest": "Understand ES6+ features, asynchronous programming (Promises/async-await), DOM, and events.",
                "path": "MDN Web Docs or javascript.info."
            },
            "machine learning": {
                "suggest": "Study supervised/unsupervised learning models, evaluation metrics, and scikit-learn/pandas/numpy.",
                "path": "Andrew Ng's 'Machine Learning Specialization' on Coursera."
            },
            "c++": {
                "suggest": "Master Object-Oriented Programming (OOP) in C++, memory management (pointers), and STL containers.",
                "path": "LearnCpp.com or 'C++ Primer' book."
            },
            "autocad": {
                "suggest": "Practice 2D drafting and 3D modeling. Learn layer management, dimensions, and drawing scale.",
                "path": "Autodesk Certified Professional training paths or LinkedIn Learning."
            },
            "matlab": {
                "suggest": "Practice matrix operations, script writing, numerical simulation, and control systems modeling.",
                "path": "MATLAB Onramp (MathWorks) and MATLAB academic tutorials."
            }
        }
        
        missing_skills = []
        suggestions = []
        learning_paths = []
        
        for c_skill in company_skills_raw:
            c_skill_clean = c_skill.strip().lower()
            
            # Check if student has the skill
            has_skill = False
            for s_skill in student_skills:
                if c_skill_clean in s_skill or s_skill in c_skill_clean:
                    has_skill = True
                    break
                    
            if not has_skill:
                missing_skills.append(c_skill)
                
                # Fetch matching suggestion/path if available, else general one
                match_found = False
                for key, info in suggestions_db.items():
                    if key in c_skill_clean or c_skill_clean in key:
                        suggestions.append(f"For {c_skill}: {info['suggest']}")
                        learning_paths.append(f"{c_skill} Path: {info['path']}")
                        match_found = True
                        break
                        
                if not match_found:
                    suggestions.append(f"For {c_skill}: Study core concepts, build small projects, and read documentation.")
                    learning_paths.append(f"{c_skill} Path: Look up introductory courses on Udemy/Coursera and read community guides.")
                    
        return jsonify({
            "success": True,
            "missingSkills": missing_skills,
            "improvementSuggestions": suggestions,
            "recommendedLearningPaths": learning_paths,
            "skillsMatchCount": len(company_skills_raw) - len(missing_skills),
            "totalCompanySkills": len(company_skills_raw)
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400


if __name__ == "__main__":
    # Flask port 5000 is standard
    app.run(host="0.0.0.0", port=5000, debug=True)
