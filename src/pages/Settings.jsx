import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { db, getServerTimestamp } from "../services/firebase";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import PasswordManager from "../components/settings/PasswordManager";
import NotificationPreferences from "../components/settings/NotificationPreferences";
import SystemPreferences from "../components/settings/SystemPreferences";
import AccountInfo from "../components/settings/AccountInfo";

const Settings = () => {
  const { currentUser, userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState("account");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [userSettings, setUserSettings] = useState({
    notifications: {
      emailAlerts: true,
      systemNotifications: true,
      rateChangeAlerts: true,
      securityAlerts: true,
    },
    system: {
      timezone: "Asia/Manila",
      dateFormat: "MM/DD/YYYY",
      language: "en",
      theme: "light",
    },
  });

  // Fetch user settings on component mount
  useEffect(() => {
    const fetchUserSettings = async () => {
      if (!currentUser) return;

      try {
        setLoading(true);
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();

          // Merge with default settings
          setUserSettings({
            notifications: {
              emailAlerts: userData.notifications?.emailAlerts ?? true,
              systemNotifications:
                userData.notifications?.systemNotifications ?? true,
              rateChangeAlerts:
                userData.notifications?.rateChangeAlerts ?? true,
              securityAlerts: userData.notifications?.securityAlerts ?? true,
            },
            system: {
              timezone: userData.system?.timezone ?? "Asia/Manila",
              dateFormat: userData.system?.dateFormat ?? "MM/DD/YYYY",
              language: userData.system?.language ?? "en",
              theme: userData.system?.theme ?? "light",
            },
          });
        }
      } catch (error) {
        console.error("Error fetching user settings:", error);
        setError("Failed to load user settings. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserSettings();
  }, [currentUser]);

  // Handle save settings
  const handleSaveSettings = async (section, data) => {
    if (!currentUser) return;

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const userDocRef = doc(db, "users", currentUser.uid);

      // Update specific section
      if (section === "notifications") {
        await updateDoc(userDocRef, {
          notifications: data,
          updated_at: getServerTimestamp(),
        });

        setUserSettings((prev) => ({
          ...prev,
          notifications: data,
        }));
      } else if (section === "system") {
        await updateDoc(userDocRef, {
          system: data,
          updated_at: getServerTimestamp(),
        });

        setUserSettings((prev) => ({
          ...prev,
          system: data,
        }));
      } else if (section === "account") {
        await updateDoc(userDocRef, {
          display_name: data.displayName,
          updated_at: getServerTimestamp(),
        });
      }

      setSuccess("Settings saved successfully!");

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (error) {
      console.error("Error saving settings:", error);
      setError("Failed to save settings. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Tabs for settings
  const tabs = [
    { id: "account", label: "Account Information" },
    { id: "password", label: "Password Management" },
    { id: "notifications", label: "Notification Preferences" },
    { id: "system", label: "System Preferences" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1e386d]">Settings</h1>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div
          className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative"
          role="alert"
        >
          <span className="block sm:inline">{success}</span>
        </div>
      )}

      {error && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
          role="alert"
        >
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {/* Settings Layout */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <div className="md:w-1/4">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <ul className="divide-y divide-gray-200">
              {tabs.map((tab) => (
                <li key={tab.id}>
                  <button
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full px-4 py-3 text-left text-sm font-medium ${
                      activeTab === tab.id
                        ? "bg-[#e6ecf5] text-[#1e386d]"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {tab.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Content */}
        <div className="md:w-3/4">
          <div className="bg-white shadow rounded-lg">
            <div className="p-6">
              {activeTab === "account" && (
                <AccountInfo
                  userProfile={userProfile}
                  onSave={(data) => handleSaveSettings("account", data)}
                  loading={loading}
                />
              )}

              {activeTab === "password" && (
                <PasswordManager
                  loading={loading}
                  onSuccess={() => {
                    setSuccess("Password updated successfully!");
                    setTimeout(() => setSuccess(""), 3000);
                  }}
                  onError={(errorMsg) => {
                    setError(errorMsg);
                    setTimeout(() => setError(""), 5000);
                  }}
                />
              )}

              {activeTab === "notifications" && (
                <NotificationPreferences
                  preferences={userSettings.notifications}
                  onSave={(data) => handleSaveSettings("notifications", data)}
                  loading={loading}
                />
              )}

              {activeTab === "system" && (
                <SystemPreferences
                  preferences={userSettings.system}
                  onSave={(data) => handleSaveSettings("system", data)}
                  loading={loading}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
