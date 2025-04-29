import React, { useState } from "react";
import {
  TIMEZONES,
  DATE_FORMATS,
  LANGUAGES,
  THEMES,
} from "../../utils/constants";

const SystemPreferences = ({ preferences, onSave, loading }) => {
  const [localPreferences, setLocalPreferences] = useState(preferences);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLocalPreferences((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(localPreferences);
  };

  // Convert constants to options format if they're not already
  const getOptions = (items) => {
    if (Array.isArray(items)) {
      if (
        items.length > 0 &&
        typeof items[0] === "object" &&
        "value" in items[0]
      ) {
        return items;
      }

      return items.map((item) => ({
        value: item,
        label: item,
      }));
    }

    return [];
  };

  const timezoneOptions = getOptions(TIMEZONES);
  const dateFormatOptions = getOptions(DATE_FORMATS);
  const languageOptions = getOptions(LANGUAGES);
  const themeOptions = getOptions(THEMES);

  return (
    <div>
      <h2 className="text-lg font-medium text-gray-900 mb-4">
        System Preferences
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="timezone"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Timezone
          </label>
          <select
            id="timezone"
            name="timezone"
            className="form-input"
            value={localPreferences.timezone}
            onChange={handleChange}
          >
            {timezoneOptions.map((tz) => (
              <option key={tz.value} value={tz.value}>
                {tz.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">
            Select your local timezone for accurate time display.
          </p>
        </div>

        <div>
          <label
            htmlFor="dateFormat"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Date Format
          </label>
          <select
            id="dateFormat"
            name="dateFormat"
            className="form-input"
            value={localPreferences.dateFormat}
            onChange={handleChange}
          >
            {dateFormatOptions.map((df) => (
              <option key={df.value} value={df.value}>
                {typeof df.label === "string"
                  ? df.label
                  : `${df.value} (e.g., ${new Date().toLocaleDateString(
                      undefined,
                      { dateStyle: "short" }
                    )})`}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">
            Choose how dates are displayed throughout the application.
          </p>
        </div>

        <div>
          <label
            htmlFor="language"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Language
          </label>
          <select
            id="language"
            name="language"
            className="form-input"
            value={localPreferences.language}
            onChange={handleChange}
          >
            {languageOptions.map((lang) => (
              <option key={lang.value} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">
            Select your preferred language for the user interface.
          </p>
        </div>

        <div>
          <label
            htmlFor="theme"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Theme
          </label>
          <select
            id="theme"
            name="theme"
            className="form-input"
            value={localPreferences.theme}
            onChange={handleChange}
          >
            {themeOptions.map((theme) => (
              <option key={theme.value} value={theme.value}>
                {theme.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">
            Choose between light and dark themes, or follow your system
            settings.
          </p>
        </div>

        <div className="pt-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Data Display
          </label>

          <div className="bg-gray-50 p-4 rounded border border-gray-200">
            <p className="text-sm text-gray-600 mb-2">Preview:</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-500">Date:</span>
                <span className="ml-2 font-medium">
                  {new Date().toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Time:</span>
                <span className="ml-2 font-medium">
                  {new Date().toLocaleTimeString()}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Number:</span>
                <span className="ml-2 font-medium">1,234.56</span>
              </div>
              <div>
                <span className="text-gray-500">Currency:</span>
                <span className="ml-2 font-medium">₱1,234.56</span>
              </div>
            </div>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            This preview shows how data will be formatted based on your
            settings.
          </p>
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

export default SystemPreferences;
