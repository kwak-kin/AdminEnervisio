// src/components/settings/AccountInfo.jsx
import React, { useState } from "react";

const AccountInfo = ({ userProfile, onSave, loading }) => {
  const [displayName, setDisplayName] = useState(
    userProfile?.display_name || ""
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ displayName });
  };

  return (
    <div>
      <h2 className="text-lg font-medium text-gray-900 mb-4">
        Account Information
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="form-label">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            className="form-input bg-gray-100"
            value={userProfile?.email || ""}
            disabled
          />
          <p className="mt-1 text-sm text-gray-500">
            Email address cannot be changed.
          </p>
        </div>

        <div>
          <label htmlFor="displayName" className="form-label">
            Display Name
          </label>
          <input
            type="text"
            id="displayName"
            className="form-input"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Enter your display name"
            required
          />
        </div>

        <div>
          <label htmlFor="userType" className="form-label">
            User Type
          </label>
          <input
            type="text"
            id="userType"
            className="form-input bg-gray-100"
            value={
              userProfile?.usertype === 3 ? "Administrator" : "Regular User"
            }
            disabled
          />
        </div>

        <div>
          <label htmlFor="created" className="form-label">
            Account Created
          </label>
          <input
            type="text"
            id="created"
            className="form-input bg-gray-100"
            value={
              userProfile?.created_time?.toDate().toLocaleString() || "N/A"
            }
            disabled
          />
        </div>

        <div>
          <label htmlFor="lastLogin" className="form-label">
            Last Login
          </label>
          <input
            type="text"
            id="lastLogin"
            className="form-input bg-gray-100"
            value={userProfile?.last_login?.toDate().toLocaleString() || "N/A"}
            disabled
          />
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
              "Save Changes"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AccountInfo;
