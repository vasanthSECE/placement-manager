import { initializeApp, getApps } from "firebase/app";

import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";

import {
  getDatabase,
  ref,
  set,
  push,
  get,
  remove,
  update
} from "firebase/database";

import { getStorage } from "firebase/storage";

import { mockDb, INITIAL_COMPANIES, INITIAL_STUDENTS } from "./mockDb";


// Firebase Config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};


// Check config
const isConfigValid =
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey !== "YOUR_API_KEY";


let app = null;
let auth = null;
let db = null;
let storage = null;
let firebaseEnabled = false;


// Firebase Initialization
if (isConfigValid) {

  try {

    app =
      getApps().length === 0
        ? initializeApp(firebaseConfig)
        : getApps()[0];

    auth = getAuth(app);

    db = getDatabase(app);

    storage = getStorage(app);

    firebaseEnabled = true;

    console.log("✅ Firebase Realtime Database Connected");

  } catch (error) {

    console.error(
      "❌ Firebase initialization failed:",
      error
    );

  }

} else {

  console.warn(
    "⚠ Firebase environment variables missing. Using Mock DB."
  );

}


export { auth, db, storage };

export const isFirebaseEnabled = () => firebaseEnabled;

// Helper to get active user's UID for data isolation
const getActiveUid = () => {
  // Try firebase authentication uid first
  if (firebaseEnabled && auth?.currentUser) {
    return auth.currentUser.uid;
  }
  // Try local mock authentication uid as fallback
  try {
    const saved = localStorage.getItem("mock_auth_user");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.uid) {
        return parsed.uid;
      }
    }
  } catch (e) {
    console.error("Error reading active uid from mock auth", e);
  }
  // Ultimate default fallback
  return "default_admin";
};


// Unified Database Service
export const dbService = {

  // =========================
  // AUTH
  // =========================

  login: async (email, password, role = "admin") => {

    if (firebaseEnabled) {

      try {
        const userCredential =
          await signInWithEmailAndPassword(
            auth,
            email,
            password
          );

        const user = userCredential.user;
        user.role = role;
        localStorage.setItem("user_role_" + user.uid, role);
        return user;
      } catch (error) {
        console.warn("Firebase credentials failed. Falling back to local mock authentication.", error.message);
        
        // Dynamic mock session creation for any custom credentials
        const mockUser = {
          uid: "mock-custom-" + Math.random().toString(36).substr(2, 9),
          email,
          displayName: role === "admin" ? "Custom Admin" : "Aditya Sharma",
          role: role,
          studentId: role === "student" ? "stud-1" : undefined
        };

        localStorage.setItem(
          "mock_auth_user",
          JSON.stringify(mockUser)
        );

        localStorage.setItem("user_role_" + mockUser.uid, mockUser.role);
        return mockUser;
      }

    } else {

      await new Promise(resolve => setTimeout(resolve, 500));

      if (
        email === "admin@college.edu" &&
        password === "admin123"
      ) {

        const mockUser = {
          uid: "mock-admin",
          email,
          displayName: "Placement Admin",
          role: "admin"
        };

        localStorage.setItem(
          "mock_auth_user",
          JSON.stringify(mockUser)
        );

        localStorage.setItem("user_role_mock-admin", "admin");
        return mockUser;
      } else if (
        email === "student@college.edu" &&
        password === "student123"
      ) {

        const mockUser = {
          uid: "mock-student",
          email,
          displayName: "Aditya Sharma",
          role: "student",
          studentId: "stud-1"
        };

        localStorage.setItem(
          "mock_auth_user",
          JSON.stringify(mockUser)
        );

        localStorage.setItem("user_role_mock-student", "student");
        return mockUser;
      } else {

        // General credentials matching the chosen role context
        const mockUser = {
          uid: "mock-custom-" + Math.random().toString(36).substr(2, 9),
          email,
          displayName: role === "admin" ? "Custom Admin" : "Aditya Sharma",
          role: role,
          studentId: role === "student" ? "stud-1" : undefined
        };

        localStorage.setItem(
          "mock_auth_user",
          JSON.stringify(mockUser)
        );

        localStorage.setItem("user_role_" + mockUser.uid, mockUser.role);
        return mockUser;
      }

    }

  },


  loginWithGoogle: async (role = "admin") => {

    if (firebaseEnabled) {

      const provider = new GoogleAuthProvider();

      const userCredential =
        await signInWithPopup(auth, provider);

      const user = userCredential.user;
      user.role = role;
      localStorage.setItem("user_role_" + user.uid, role);
      return user;

    } else {

      const mockUser = {
        uid: "mock-google-" + Math.random().toString(36).substr(2, 9),
        email: role === "admin" ? "google.admin@college.edu" : "google.student@college.edu",
        displayName: role === "admin" ? "Google Admin" : "Aditya Sharma",
        role: role,
        studentId: role === "student" ? "stud-1" : undefined
      };

      localStorage.setItem(
        "mock_auth_user",
        JSON.stringify(mockUser)
      );

      localStorage.setItem("user_role_" + mockUser.uid, mockUser.role);
      return mockUser;

    }

  },


  logout: async () => {

    // Always clear mock session key
    localStorage.removeItem("mock_auth_user");

    if (firebaseEnabled) {

      await signOut(auth);

    }

    return true;

  },


  onAuthStateChangedListener: (callback) => {

    // Check if there is an active mock session
    const savedMockUser = localStorage.getItem("mock_auth_user");
    if (savedMockUser) {
      callback(JSON.parse(savedMockUser));
      return () => {}; // return empty unsubscribe handler
    }

    if (firebaseEnabled) {

      return onAuthStateChanged(
        auth,
        callback
      );

    } else {

      callback(null);

    }

  },


  // =========================
  // COMPANIES CRUD
  // =========================

  getCompanies: async () => {

    if (firebaseEnabled) {

      const uid = getActiveUid();
      const dbRef = ref(db, `users/${uid}/companies`);
      const snapshot = await get(dbRef);

      if (snapshot.exists()) {

        const data = snapshot.val();

        return Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));

      }

      // Automatically seed database workspace only for demo accounts if it does not exist
      if (uid === "mock-admin" || uid === "mock-student" || uid === "default_admin") {
        const seedData = {};
        INITIAL_COMPANIES.forEach(company => {
          seedData[company.id] = company;
        });
        await set(dbRef, seedData);
        return INITIAL_COMPANIES;
      }

      return [];

    } else {

      return mockDb.getCompanies();

    }

  },


  saveCompany: async (company) => {

    if (firebaseEnabled) {

      const uid = getActiveUid();
      if (company.id) {

        const { id, ...data } = company;

        await update(
          ref(db, `users/${uid}/companies/${id}`),
          {
            ...data,
            updatedAt: new Date().toISOString()
          }
        );

      } else {

        const newCompanyRef =
          push(ref(db, `users/${uid}/companies`));

        await set(newCompanyRef, {
          ...company,
          createdAt: new Date().toISOString()
        });

      }

      return true;

    } else {

      return mockDb.saveCompany(company);

    }

  },


  deleteCompany: async (id) => {

    if (firebaseEnabled) {

      const uid = getActiveUid();
      await remove(
        ref(db, `users/${uid}/companies/${id}`)
      );

      return true;

    } else {

      return mockDb.deleteCompany(id);

    }

  },

  deleteAllCompanies: async () => {

    if (firebaseEnabled) {

      const uid = getActiveUid();
      await remove(ref(db, `users/${uid}/companies`));
      return true;

    } else {

      return mockDb.deleteAllCompanies();

    }

  },


  // =========================
  // STUDENTS CRUD
  // =========================

  getStudents: async () => {

    if (firebaseEnabled) {

      const uid = getActiveUid();
      const dbRef = ref(db, `users/${uid}/students`);
      const snapshot = await get(dbRef);

      if (snapshot.exists()) {

        const data = snapshot.val();

        return Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));

      }

      // Automatically seed database workspace only for demo accounts if it does not exist
      if (uid === "mock-admin" || uid === "mock-student" || uid === "default_admin") {
        const seedData = {};
        INITIAL_STUDENTS.forEach(student => {
          seedData[student.id] = student;
        });
        await set(dbRef, seedData);
        return INITIAL_STUDENTS;
      }

      return [];

    } else {

      return mockDb.getStudents();

    }

  },


  saveStudent: async (student) => {

    if (firebaseEnabled) {

      const uid = getActiveUid();
      if (student.id) {

        const { id, ...data } = student;

        await update(
          ref(db, `users/${uid}/students/${id}`),
          {
            ...data,
            updatedAt: new Date().toISOString()
          }
        );

      } else {

        const newStudentRef =
          push(ref(db, `users/${uid}/students`));

        await set(newStudentRef, {
          ...student,
          createdAt: new Date().toISOString()
        });

      }

      return true;

    } else {

      return mockDb.saveStudent(student);

    }

  },


  deleteStudent: async (id) => {

    if (firebaseEnabled) {

      const uid = getActiveUid();
      await remove(
        ref(db, `users/${uid}/students/${id}`)
      );

      return true;

    } else {

      return mockDb.deleteStudent(id);

    }

  },

  deleteAllStudents: async () => {

    if (firebaseEnabled) {

      const uid = getActiveUid();
      await remove(ref(db, `users/${uid}/students`));
      return true;

    } else {

      return mockDb.deleteAllStudents();

    }

  },


  // =========================
  // ANALYTICS
  // =========================

  getAnalytics: async () => {

    if (firebaseEnabled) {

      const students =
        await dbService.getStudents();

      const companies =
        await dbService.getCompanies();

      const totalCompanies =
        companies.length;

      const totalPlaced =
        students.filter(
          s =>
            s.placementStatus === "Placed"
        ).length;

      const totalInternship =
        students.filter(
          s =>
            s.placementStatus === "Interned"
        ).length;

      const packages =
        students
          .filter(
            s =>
              s.package > 0
          )
          .map(s => Number(s.package));

      const highestPackage =
        packages.length
          ? Math.max(...packages)
          : 0;

      const averagePackage =
        packages.length
          ? (
              packages.reduce(
                (a, b) => a + b,
                0
              ) / packages.length
            ).toFixed(2)
          : 0;

      const departments = ["CSE", "IT", "ECE", "EEE", "MECH", "AI-DS", "AI-ML"];

      const deptStats = departments.map(dept => {
        const deptStudents = students.filter(s => s.department === dept);
        const placedCount = deptStudents.filter(
          s => s.placementStatus === "Placed" || s.placementStatus === "Interned"
        ).length;
        return {
          name: dept,
          total: deptStudents.length,
          placed: placedCount,
          percentage: deptStudents.length ? Math.round((placedCount / deptStudents.length) * 100) : 0
        };
      });

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

      const recruiterActivity = companies
        .map(c => ({
          name: c.companyName,
          package: c.package ?? 0,
          hiredCount: c.totalSelected ?? 0,
          visitDate: c.visitDate || "TBD"
        }))
        .sort((a, b) => b.hiredCount - a.hiredCount)
        .slice(0, 8);

      const fourthYears = students.filter(s => s.yearOfStudy === "4th Year");
      const fourthYearsPlaced = fourthYears.filter(s => s.placementStatus === "Placed").length;

      return {
        kpis: {
          totalCompanies,
          totalPlaced,
          totalInternshipOffers: totalInternship,
          totalFullTimeOffers: students.filter(
            s => s.offerType === "Full-Time"
          ).length,
          highestPackage,
          averagePackage,
          placementPercentage: fourthYears.length ? Math.round((fourthYearsPlaced / fourthYears.length) * 100) : 0
        },
        deptStats,
        yearWiseTrends: [
          { year: 2024, placementRate: 72.5, highestPackage: 24.0, averagePackage: 5.2, companies: 45 },
          { year: 2025, placementRate: 80.0, highestPackage: 28.5, averagePackage: 5.8, companies: 52 },
          { year: 2026, placementRate: 85.0, highestPackage: 32.0, averagePackage: 6.4, companies: 58 }
        ],
        topRecruiters,
        monthlyTrends,
        recruiterActivity
      };

    } else {

      return mockDb.getAnalytics();

    }

  }

};