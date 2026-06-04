import React, { createContext, useContext, useState, useEffect } from "react";
import { dbService } from "../services/firebase";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = dbService.onAuthStateChangedListener((currentUser) => {
      if (currentUser) {
        const savedRole = localStorage.getItem("user_role_" + currentUser.uid) || "student";
        const linkedStudentId = localStorage.getItem("linked_student_id_" + currentUser.uid) || "stud-1";
        
        setUser({
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
          photoURL: currentUser.photoURL,
          role: savedRole,
          studentId: savedRole === "student" ? linkedStudentId : undefined
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const login = async (email, password, role) => {
    setLoading(true);
    try {
      const u = await dbService.login(email, password, role);
      setUser(u);
      return u;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async (role) => {
    setLoading(true);
    try {
      const u = await dbService.loginWithGoogle(role);
      setUser(u);
      return u;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await dbService.logout();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithGoogle, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
