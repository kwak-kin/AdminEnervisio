// src/components/settings/NotificationPreferences.jsx
import React, { useState } from "react";

const NotificationPreferences = ({ preferences, onSave, loading }) => {
  const [localPreferences, setLocalPreferences] = useState(preferences);

  const handleChange = (e) => {
    const { name, checked } = e.target;
    setLocalPreferences((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(localPreferences);
  };

  return (
    <div>
      <h2 className="text-lg font-medium text-gray-900 mb-4">
        Notification Preferences
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="emailAlerts"
                name="emailAlerts"
                type="checkbox"
                checked={localPreferences.emailAlerts}
                onChange={handleChange}
                className="focus:ring-[#1e386d] h-4 w-4 text-[#1e386d] border-gray-300 rounded"
              />
            </div>
            <div className="ml-3 text-sm">
              <label
                htmlFor="emailAlerts"
                className="font-medium text-gray-700"
              >
                Email Alerts
              </label>
              <p className="text-gray-500">
                Receive important notifications via email.
              </p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="systemNotifications"
                name="systemNotifications"
                type="checkbox"
                checked={localPreferences.systemNotifications}
                onChange={handleChange}
                className="focus:ring-[#1e386d] h-4 w-4 text-[#1e386d] border-gray-300 rounded"
              />
            </div>
            <div className="ml-3 text-sm">
              <label
                htmlFor="systemNotifications"
                className="font-medium text-gray-700"
              >
                System Notifications
              </label>
              <p className="text-gray-500">
                Receive notifications within the dashboard.
              </p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="rateChangeAlerts"
                name="rateChangeAlerts"
                type="checkbox"
                checked={localPreferences.rateChangeAlerts}
                onChange={handleChange}
                className="focus:ring-[#1e386d] h-4 w-4 text-[#1e386d] border-gray-300 rounded"
              />
            </div>
            <div className="ml-3 text-sm">
              <label
                htmlFor="rateChangeAlerts"
                className="font-medium text-gray-700"
              >
                Rate Change Alerts
              </label>
              <p className="text-gray-500">
                Be notified when electricity rates change.
              </p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="securityAlerts"
                name="securityAlerts"
                type="checkbox"
                checked={localPreferences.securityAlerts}
                onChange={handleChange}
                className="focus:ring-[#1e386d] h-4 w-4 text-[#1e386d] border-gray-300 rounded"
              />
            </div>
            <div className="ml-3 text-sm">
              <label
                htmlFor="securityAlerts"
                className="font-medium text-gray-700"
              >
                Security Alerts
              </label>
              <p className="text-gray-500">
                Receive alerts about account security (login attempts, password
                changes).
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-[#1e386d] text-white px-4 py-2 rounded font-medium hover:bg-[#152951] focus:outline-none focus:ring-2 focus:ring-[#1e386d] focus:ring-offset-2 flex items-center"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              "Save Preferences"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NotificationPreferences;
