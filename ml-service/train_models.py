import os
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression, LinearRegression
import joblib

def generate_synthetic_data(num_samples=1200):
    np.random.seed(42)
    
    # Departments
    departments = ["CSE", "ECE", "EEE", "MECH", "AI-DS", "AI-ML", "IT"]
    dept_choices = np.random.choice(departments, size=num_samples)
    
    # CGPA (5.0 to 10.0)
    cgpa = np.clip(np.random.normal(7.8, 0.9, size=num_samples), 5.0, 10.0)
    
    # Aptitude Score (40 to 100)
    aptitude_score = np.clip(np.random.normal(72, 12, size=num_samples), 40, 100).astype(int)
    
    # Communication Score (40 to 100)
    communication_score = np.clip(np.random.normal(70, 15, size=num_samples), 40, 100).astype(int)
    
    # Internship Experience (0 to 3)
    internships = np.random.choice([0, 1, 2, 3], size=num_samples, p=[0.5, 0.35, 0.12, 0.03])
    
    # Certifications count (0 to 4)
    certifications = np.random.choice([0, 1, 2, 3, 4], size=num_samples, p=[0.4, 0.35, 0.15, 0.08, 0.02])
    
    # Skills count (1 to 10)
    skills_count = np.clip(np.random.normal(4.5, 2.0, size=num_samples), 1, 10).astype(int)
    
    # Generate Placement Label
    # Placement probability based on academic and technical parameters
    # High weights on CGPA, Aptitude, Comm, Internships
    z = (
        (cgpa - 7.0) * 1.8 +
        (aptitude_score - 60) * 0.08 +
        (communication_score - 60) * 0.06 +
        internships * 1.5 +
        certifications * 0.4 +
        (skills_count - 3) * 0.3 -
        2.5
    )
    # Convert log-odds to probability
    prob = 1 / (1 + np.exp(-z))
    # Randomly draw based on probability
    placed = np.random.binomial(1, prob)
    
    # Expected Salary Package in LPA (Linear Regression target)
    # Base package is 3.5 LPA. Adjust for profile.
    base_package = 3.5
    package = (
        base_package + 
        (cgpa - 6.0) * 1.2 + 
        internships * 1.8 + 
        certifications * 0.6 + 
        skills_count * 0.3 + 
        np.random.normal(0, 0.8, size=num_samples)
    )
    package = np.clip(package, 3.0, 42.0)
    # Clean package for unplaced students - for training, we can keep the expected potential package
    # but we can round it to 2 decimal places.
    package = np.round(package, 2)
    
    # Combine into DataFrame
    df = pd.DataFrame({
        "department": dept_choices,
        "cgpa": np.round(cgpa, 2),
        "aptitudeScore": aptitude_score,
        "communicationScore": communication_score,
        "internshipExperience": internships,
        "certifications": certifications,
        "skillsCount": skills_count,
        "placed": placed,
        "package": package
    })
    
    return df

def train_and_save_models():
    print("Generating synthetic student data...")
    df = generate_synthetic_data(1200)
    
    # Create directories if they don't exist
    os.makedirs("models", exist_ok=True)
    os.makedirs("data", exist_ok=True)
    
    # Save training dataset
    df.to_csv("data/synthetic_data.csv", index=False)
    print("Synthetic data saved to data/synthetic_data.csv")
    
    # ------------------ 1. PLACEMENT PREDICTION MODEL ------------------
    # Features: cgpa, aptitudeScore, communicationScore, internshipExperience, certifications, skillsCount, department
    # Target: placed
    X_cls = df[["cgpa", "aptitudeScore", "communicationScore", "internshipExperience", "certifications", "skillsCount", "department"]]
    y_cls = df["placed"]
    
    X_train_c, X_test_c, y_train_c, y_test_c = train_test_split(X_cls, y_cls, test_size=0.2, random_state=42)
    
    # Define preprocessing pipelines
    num_cols = ["cgpa", "aptitudeScore", "communicationScore", "internshipExperience", "certifications", "skillsCount"]
    cat_cols = ["department"]
    
    preprocessor = ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), num_cols),
            ("cat", OneHotEncoder(handle_unknown="ignore"), cat_cols)
        ]
    )
    
    # Full classification pipeline
    cls_pipeline = Pipeline(steps=[
        ("preprocessor", preprocessor),
        ("classifier", LogisticRegression(random_state=42))
    ])
    
    print("Training Placement Prediction Model (Logistic Regression)...")
    cls_pipeline.fit(X_train_c, y_train_c)
    cls_score = cls_pipeline.score(X_test_c, y_test_c)
    print(f"Placement Classifier Accuracy on Test Set: {cls_score * 100:.2f}%")
    
    # Save the classifier pipeline
    joblib.dump(cls_pipeline, "models/placement_model.joblib")
    print("Saved classification model to models/placement_model.joblib")
    
    # ------------------ 2. SALARY PREDICTION MODEL ------------------
    # We want to train only on placed students to predict realistic expected salary packages
    df_placed = df[df["placed"] == 1]
    
    # Features: cgpa, internshipExperience (internships), skillsCount (skills), certifications
    # Target: package
    X_reg = df_placed[["cgpa", "internshipExperience", "skillsCount", "certifications"]]
    y_reg = df_placed["package"]
    
    X_train_r, X_test_r, y_train_r, y_test_r = train_test_split(X_reg, y_reg, test_size=0.2, random_state=42)
    
    # Salary regression pipeline
    reg_preprocessor = ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), ["cgpa", "internshipExperience", "skillsCount", "certifications"])
        ]
    )
    
    reg_pipeline = Pipeline(steps=[
        ("preprocessor", reg_preprocessor),
        ("regressor", LinearRegression())
    ])
    
    print("Training Salary Prediction Model (Linear Regression)...")
    reg_pipeline.fit(X_train_r, y_train_r)
    reg_score = reg_pipeline.score(X_test_r, y_test_r)
    print(f"Salary Regressor R^2 Score on Test Set: {reg_score:.4f}")
    
    # Save the regression pipeline
    joblib.dump(reg_pipeline, "models/salary_model.joblib")
    print("Saved salary regression model to models/salary_model.joblib")

if __name__ == "__main__":
    train_and_save_models()
