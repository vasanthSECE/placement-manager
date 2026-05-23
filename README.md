# AI-Powered Campus Placement Analytics System

An engineering college placement analytics platform that manages company visit records, internships, full-time offers, student directories, department analytics, and machine learning predictions.

---

## Technical Stack

*   **Frontend**: React (Vite), Tailwind CSS v3, React Router DOM v6, Axios, Recharts, Lucide React
*   **Database & Core Backend**: Firebase (Authentication, Firestore, Storage) with a local `localStorage` mock database fallback
*   **Machine Learning Service**: Python, Flask, Flask-CORS, Scikit-learn, Pandas, NumPy, Joblib

---

## Project Structure

```text
c:\PM\
├── frontend\                 # React.js application
│   ├── src\
│   │   ├── assets\           # Static resource assets
│   │   ├── components\       # Sidebar, Navbar, and layout elements
│   │   ├── context\          # Global contexts (Auth, Theme)
│   │   ├── pages\            # App views (Dashboard, Companies, Students, Analytics, Predictions, Reports, Settings)
│   │   ├── services\         # Firebase connectivity, Mock DB fallback, and ML API services
│   │   ├── utils\            # CSV/Excel export helpers, PDF print builders
│   │   ├── App.jsx           # Routing controls
│   │   ├── index.css         # Custom animations & Tailwind base
│   │   └── main.jsx          # Context bootstrapping
│   ├── index.html            # Main markup page (with Outfit/Inter Google fonts)
│   ├── tailwind.config.js    # Tailwind layout settings
│   ├── postcss.config.js     # PostCSS loader config
│   ├── vite.config.js        # Vite compilation options
│   └── package.json          # Node dependencies
│
├── ml-service\               # Flask ML Backend API
│   ├── data\                 # Synthetic dataset cache directory
│   │   └── synthetic_data.csv
│   ├── models\               # Fitted joblib serialization pipelines
│   │   ├── placement_model.joblib
│   │   └── salary_model.joblib
│   ├── app.py                # Main Flask API endpoints
│   ├── train_models.py       # Model training & fitting script
│   └── requirements.txt      # Python dependencies
│
└── README.md                 # Setup and run instructions
```

---

## Machine Learning Capabilities

The Python Flask API provides predictive intelligence by serving models trained on a custom cohort of 1,200+ student profiles:
1.  **Placement Probability (/predict-placement)**: Serves a **Logistic Regression Pipeline** (incorporating `StandardScaler` and `OneHotEncoder` preprocessing) to estimate the percentage likelihood of student placements.
2.  **Salary Estimator (/predict-salary)**: Uses a **Linear Regression Pipeline** to predict expected salary packages (LPA) based on skill depth, GPA, and internships.
3.  **Company Recommendation System (/recommend-companies)**: Evaluates student profiles against active visiting companies to calculate percentage matching scores and eligibility.
4.  **Skill Gap Analyzer (/skill-gap-analysis)**: Inspects student skill tags against company prerequisites to identify missing qualifications, suggest improvements, and list online learning paths.

---

## Installation & Setup Instructions

### 1. Prerequisites
Ensure you have the following installed:
*   **Node.js** (v18.0.0 or higher) & **npm** (v9.0.0 or higher)
*   **Python** (v3.9 or higher) & **pip**

---

### 2. Set Up the Machine Learning Backend

1.  Navigate to the `ml-service` directory:
    ```bash
    cd ml-service
    ```
2.  Install the required Python packages:
    ```bash
    pip install -r requirements.txt
    ```
3.  *(Optional)* Retrain the machine learning pipelines (this generates the training dataset and saves fitted model pipelines inside `models/`):
    ```bash
    python train_models.py
    ```
4.  Start the Flask backend server:
    ```bash
    python app.py
    ```
    The Flask backend will start on **`http://localhost:5000`**.

---

### 3. Set Up the React Frontend

1.  Open a new terminal window and navigate to the `frontend` directory:
    ```bash
    cd frontend
    ```
2.  Install the Node dependencies:
    ```bash
    npm install
    ```
3.  *(Optional)* **Connect your Cloud Firebase Instance**:
    To hook the application up to a live Firebase instance (instead of the automatic Local Storage mock database), create a `.env` file inside the `frontend` folder:
    ```ini
    VITE_FIREBASE_API_KEY=your_api_key
    VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
    VITE_FIREBASE_PROJECT_ID=your_project_id
    VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
    VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
    VITE_FIREBASE_APP_ID=your_app_id
    ```
4.  Start the local React development server:
    ```bash
    npm run dev
    ```
    Open your browser and navigate to **`http://localhost:5173`** (or the URL shown in your terminal).

---

## Admin Portal Quick Access (Demo Credentials)

For testing purposes, the application provides an auto-fill helper or you can log in manually using:
*   **Email**: `admin@college.edu`
*   **Password**: `admin123`
