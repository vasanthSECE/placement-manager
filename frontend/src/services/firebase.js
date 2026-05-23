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
  getFirestore, 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  setDoc,
  query,
  where,
  orderBy
} from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { mockDb } from "./mockDb";

// Firebase Config from Env variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Check if configuration is fully populated
const isConfigValid = firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY";

let app = null;
let auth = null;
let db = null;
let storage = null;
let firebaseEnabled = false;

if (isConfigValid) {
  try {
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
      auth = getAuth(app);
      db = getFirestore(app);
      storage = getStorage(app);
      firebaseEnabled = true;
      console.log("Firebase initialized successfully.");
    }
  } catch (error) {
    console.error("Firebase initialization failed, falling back to Mock DB mode:", error);
  }
} else {
  console.warn("Firebase configuration environment variables are missing. Running in Mock Database Fallback Mode.");
}

export { auth, db, storage };
export const isFirebaseEnabled = () => firebaseEnabled;

// Unified database service that decides between Firebase and Mock DB
export const dbService = {
  // Auth Interface
  login: async (email, password) => {
    if (firebaseEnabled) {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } else {
      // Mock Login
      await new Promise(resolve => setTimeout(resolve, 500));
      if (email === "admin@college.edu" && password === "admin123") {
        const mockUser = {
          uid: "mock-admin-uid",
          email: "admin@college.edu",
          displayName: "College Placement Admin",
          role: "admin"
        };
        localStorage.setItem("mock_auth_user", JSON.stringify(mockUser));
        return mockUser;
      }
      throw new Error("Invalid admin credentials. Use admin@college.edu / admin123");
    }
  },

  loginWithGoogle: async () => {
    if (firebaseEnabled) {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      return userCredential.user;
    } else {
      // Mock Google Login
      await new Promise(resolve => setTimeout(resolve, 500));
      const mockUser = {
        uid: "mock-google-uid",
        email: "google.admin@college.edu",
        displayName: "Google Admin Partner",
        role: "admin"
      };
      localStorage.setItem("mock_auth_user", JSON.stringify(mockUser));
      return mockUser;
    }
  },

  logout: async () => {
    if (firebaseEnabled) {
      await signOut(auth);
    } else {
      await new Promise(resolve => setTimeout(resolve, 300));
      localStorage.removeItem("mock_auth_user");
    }
    return true;
  },

  onAuthStateChangedListener: (callback) => {
    if (firebaseEnabled) {
      return onAuthStateChanged(auth, callback);
    } else {
      // Simulate listener with initial check
      const checkAuth = () => {
        const user = localStorage.getItem("mock_auth_user");
        callback(user ? JSON.parse(user) : null);
      };
      
      checkAuth();
      
      // Listen to storage changes for multi-tab mock auth sync
      const storageListener = (e) => {
        if (e.key === "mock_auth_user") {
          checkAuth();
        }
      };
      window.addEventListener("storage", storageListener);
      return () => {
        window.removeEventListener("storage", storageListener);
      };
    }
  },

  // --- COMPANIES CRUD ---
  getCompanies: async () => {
    if (firebaseEnabled) {
      const q = query(collection(db, "companies"), orderBy("visitDate", "desc"));
      const querySnapshot = await getDocs(q);
      const list = [];
      querySnapshot.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() });
      });
      return list;
    } else {
      return mockDb.getCompanies();
    }
  },

  saveCompany: async (company) => {
    if (firebaseEnabled) {
      const { id, ...data } = company;
      if (id) {
        await updateDoc(doc(db, "companies", id), {
          ...data,
          updatedAt: new Date().toISOString()
        });
      } else {
        await addDoc(collection(db, "companies"), {
          ...data,
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
      await deleteDoc(doc(db, "companies", id));
      return true;
    } else {
      return mockDb.deleteCompany(id);
    }
  },

  // --- STUDENTS CRUD ---
  getStudents: async () => {
    if (firebaseEnabled) {
      const querySnapshot = await getDocs(collection(db, "students"));
      const list = [];
      querySnapshot.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() });
      });
      return list;
    } else {
      return mockDb.getStudents();
    }
  },

  saveStudent: async (student) => {
    if (firebaseEnabled) {
      const { id, ...data } = student;
      if (id) {
        await updateDoc(doc(db, "students", id), {
          ...data,
          updatedAt: new Date().toISOString()
        });
      } else {
        await addDoc(collection(db, "students"), {
          ...data,
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
      await deleteDoc(doc(db, "students", id));
      return true;
    } else {
      return mockDb.deleteStudent(id);
    }
  },

  // --- ANALYTICS ---
  getAnalytics: async () => {
    // If Firebase is active, we can perform aggregation dynamically in JS to avoid complex Firestore configurations
    // This maintains parity between modes
    if (firebaseEnabled) {
      const students = await dbService.getStudents();
      const companies = await dbService.getCompanies();
      // Compute same KPIs
      const totalCompanies = companies.length;
      const totalPlaced = students.filter(s => s.placementStatus === "Placed").length;
      const totalInternship = students.filter(s => s.placementStatus === "Interned").length;
      
      const placedWithPackages = students.filter(s => s.placementStatus === "Placed" && s.package > 0);
      const packages = placedWithPackages.map(s => s.package);
      const highestPackage = packages.length ? Math.max(...packages) : 0;
      const averagePackage = packages.length ? packages.reduce((a, b) => a + b, 0) / packages.length : 0;

      const fourthYears = students.filter(s => s.yearOfStudy === "4th Year");
      const fourthYearsPlaced = fourthYears.filter(s => s.placementStatus === "Placed").length;
      const placementPercentage = fourthYears.length ? (fourthYearsPlaced / fourthYears.length) * 100 : 0;

      const departments = ["CSE", "IT", "ECE", "EEE", "MECH", "CIVIL"];
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

      const yearWiseTrends = [
        { year: 2024, placementRate: 72.5, highestPackage: 24.0, averagePackage: 5.2, companies: 45 },
        { year: 2025, placementRate: 80.0, highestPackage: 28.5, averagePackage: 5.8, companies: 52 },
        { year: 2026, placementRate: 85.0, highestPackage: 32.0, averagePackage: 6.4, companies: 58 }
      ];

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
    } else {
      return mockDb.getAnalytics();
    }
  }
};
