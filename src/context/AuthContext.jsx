import React, { createContext, useContext, useState, useEffect } from "react";
import {
  auth,
  db,
  loginUser,
  logoutUser,
  sendPasswordReset,
  setupInactivityMonitoring,
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword,
} from "../services/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore";

// Create the context
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => {
  return useContext(AuthContext);
};

// Provider component
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [error, setError] = useState("");

  // Function to login
  const login = async (email, password) => {
    try {
      setError("");
      const user = await loginUser(email, password);
      return user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Function to logout
  const logout = async () => {
    try {
      setError("");
      await logoutUser();
      setCurrentUser(null);
      setUserProfile(null);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Function to send password reset email
  const resetPassword = async (email) => {
    try {
      setError("");
      await sendPasswordReset(email);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Function to change password
  const changePassword = async (currentPassword, newPassword) => {
    try {
      setError("");

      if (!currentUser) {
        throw new Error("No user is currently logged in");
      }

      // Re-authenticate user before changing password
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        currentPassword
      );

      await reauthenticateWithCredential(currentUser, credential);

      // Check password history
      const userRef = doc(db, "users", currentUser.uid);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const passwordHistory = userData.passwordHistory || [];

        // Check if new password matches any of the last 3 passwords
        for (let i = 0; i < Math.min(passwordHistory.length, 3); i++) {
          const oldCredential = EmailAuthProvider.credential(
            currentUser.email,
            passwordHistory[i]
          );

          try {
            // This will throw an error if the passwords don't match
            await reauthenticateWithCredential(currentUser, oldCredential);
            throw new Error("Cannot reuse one of your last 3 passwords");
          } catch (authError) {
            // If error is "auth/wrong-password", it means passwords don't match, which is what we want
            if (authError.code !== "auth/wrong-password") {
              // If it's our custom error or another error, rethrow it
              throw authError;
            }
          }
        }

        // Update password and password history
        await updatePassword(currentUser, newPassword);

        // Update password history in Firestore
        const updatedHistory = [currentPassword, ...passwordHistory].slice(
          0,
          3
        );
        await updateDoc(userRef, {
          passwordHistory: updatedHistory,
        });

        return true;
      } else {
        throw new Error("User profile not found");
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Fetch user profile data
  const fetchUserProfile = async (uid) => {
    try {
      const userRef = doc(db, "users", uid);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();

        // Ensure this is an admin user
        if (userData.usertype !== 3) {
          await logout();
          throw new Error("Access denied. Admin privileges required.");
        }

        setUserProfile(userData);
        return userData;
      } else {
        throw new Error("User profile not found");
      }
    } catch (err) {
      console.error("Error fetching user profile:", err);
      throw err;
    }
  };

  // Effect to handle auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (user) {
        try {
          await fetchUserProfile(user.uid);
          setupInactivityMonitoring();
        } catch (err) {
          console.error("Error setting up user session:", err);
        }
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
    login,
    logout,
    resetPassword,
    changePassword,
    error,
    setError,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
