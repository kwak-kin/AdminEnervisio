// src/components/dashboard/UserStats.jsx
import React from "react";

const UserStats = ({ stats }) => {
  return (
    <div className="card h-full">
      <h3 className="text-lg font-semibold text-[#1e386d] mb-4">
        User Statistics
      </h3>

      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-500">Total Users</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>

        <div>
          <p className="text-sm text-gray-500">Active Users (7 days)</p>
          <p className="text-2xl font-bold">{stats.active}</p>
          <p className="text-xs text-gray-500 mt-1">
            {stats.total > 0
              ? `${Math.round(
                  (stats.active / stats.total) * 100
                )}% of total users`
              : "0% of total users"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserStats;
