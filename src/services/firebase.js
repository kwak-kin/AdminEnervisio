import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDeVceslElANNOMK9IjuUo3bEf9hxJO1xs",
  projectId: "re-enervisio-c1-ivy4rg",
  appId: "1:227792604576:web:b7101d48ec9b223533e8c5",
  // Note: Since this is for an admin dashboard, we're focusing on Auth and Firestore only
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Prevent multiple login attempts
let loginAttempts = {};

// Security timeout for inactive sessions (30 minutes)
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds
let inactivityTimer;

const resetInactivityTimer = () => {
  clearTimeout(inactivityTimer);
  inactivityTimer = setTimeout(() => {
    // Force logout after inactivity
    signOut(auth).catch((error) => {
      console.error("Error signing out after inactivity:", error);
    });
  }, SESSION_TIMEOUT);
};

// Set up inactivity monitoring
const setupInactivityMonitoring = () => {
  // Reset timer on user activity
  ["mousedown", "keypress", "scroll", "touchstart"].forEach((event) => {
    document.addEventListener(event, resetInactivityTimer, true);
  });

  // Initial setup of timer
  resetInactivityTimer();
};

// Authentication helpers
const loginUser = async (email, password) => {
  // Check if user has exceeded login attempts
  const userKey = email.toLowerCase();
  if (loginAttempts[userKey] && loginAttempts[userKey].count >= 5) {
    const lockoutTime = loginAttempts[userKey].timestamp + 15 * 60 * 1000; // 15 min lockout
    if (Date.now() < lockoutTime) {
      const remainingMinutes = Math.ceil((lockoutTime - Date.now()) / 60000);
      throw new Error(
        `Too many failed login attempts. Please try again in ${remainingMinutes} minutes.`
      );
    } else {
      // Reset counter after lockout period
      delete loginAttempts[userKey];
    }
  }

  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    // Verify user type is admin (usertype = 3)
    const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
    if (!userDoc.exists() || userDoc.data().usertype !== 3) {
      await signOut(auth);
      throw new Error("Access denied. Admin privileges required.");
    }

    // Log successful login to audit trail
    await addDoc(collection(db, "audittrail"), {
      action: "LOGIN",
      timestamp: serverTimestamp(),
      uid: userCredential.user.uid,
      details: {
        email: email,
        method: "EMAIL_PASSWORD",
      },
    });

    // Reset login attempts for this user
    delete loginAttempts[userKey];

    // Set up inactivity monitoring
    setupInactivityMonitoring();

    // Update last login time
    await updateDoc(doc(db, "users", userCredential.user.uid), {
      last_login: serverTimestamp(),
    });

    return userCredential.user;
  } catch (error) {
    // Track failed login attempts
    loginAttempts[userKey] = loginAttempts[userKey] || { count: 0 };
    loginAttempts[userKey].count += 1;
    loginAttempts[userKey].timestamp = Date.now();

    // Log failed login to audit trail (if email exists)
    try {
      // Try to find user with this email
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const user = querySnapshot.docs[0];
        await addDoc(collection(db, "audittrail"), {
          action: "FAILED_LOGIN",
          timestamp: serverTimestamp(),
          uid: user.id,
          details: {
            email: email,
            reason: error.code || "INVALID_CREDENTIALS",
          },
        });
      }
    } catch (auditError) {
      console.error("Error logging to audit trail:", auditError);
    }

    throw error;
  }
};

const logoutUser = async () => {
  try {
    // Get current user before signing out
    const currentUser = auth.currentUser;

    if (currentUser) {
      // Log to audit trail
      await addDoc(collection(db, "audittrail"), {
        action: "LOGOUT",
        timestamp: serverTimestamp(),
        uid: currentUser.uid,
        details: {
          email: currentUser.email,
        },
      });
    }

    // Clear inactivity timer
    clearTimeout(inactivityTimer);

    // Remove event listeners
    ["mousedown", "keypress", "scroll", "touchstart"].forEach((event) => {
      document.removeEventListener(event, resetInactivityTimer, true);
    });

    return await signOut(auth);
  } catch (error) {
    console.error("Error during logout:", error);
    throw error;
  }
};

const sendPasswordReset = async (email) => {
  try {
    // Verify email exists and is an admin
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error("Email not found.");
    }

    const userDoc = querySnapshot.docs[0];
    if (userDoc.data().usertype !== 3) {
      throw new Error("This account does not have admin privileges.");
    }

    await sendPasswordResetEmail(auth, email);

    // Log to audit trail
    await addDoc(collection(db, "audittrail"), {
      action: "PASSWORD_RESET_REQUEST",
      timestamp: serverTimestamp(),
      uid: userDoc.id,
      details: {
        email: email,
      },
    });

    return true;
  } catch (error) {
    console.error("Error sending password reset:", error);
    throw error;
  }
};

// Firestore helpers
const getServerTimestamp = () => {
  return serverTimestamp();
};

const createTimestamp = (date) => {
  return Timestamp.fromDate(date);
};

export {
  auth,
  db,
  loginUser,
  logoutUser,
  sendPasswordReset,
  getServerTimestamp,
  createTimestamp,
  setupInactivityMonitoring,
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword,
};
