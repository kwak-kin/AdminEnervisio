// src/components/reports/UserActivityChart.jsx
import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const UserActivityChart = ({ data }) => {
  // Sort data by date
  const sortedData = [...data].sort((a, b) => a.date - b.date);

  // Calculate totals
  const totalAdmin = sortedData.reduce((sum, item) => sum + item.admin, 0);
  const totalRegular = sortedData.reduce((sum, item) => sum + item.regular, 0);
  const totalActions = totalAdmin + totalRegular;

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-[#1e386d]">
        User Activity by Type
      </h3>

      {sortedData.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No user activity data available for the selected time period.
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Admin Actions</p>
              <p className="text-2xl font-bold">{totalAdmin}</p>
              <p className="text-xs text-gray-500 mt-1">
                {totalActions > 0
                  ? `${Math.round((totalAdmin / totalActions) * 100)}% of total`
                  : "0%"}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Regular User Actions</p>
              <p className="text-2xl font-bold">{totalRegular}</p>
              <p className="text-xs text-gray-500 mt-1">
                {totalActions > 0
                  ? `${Math.round(
                      (totalRegular / totalActions) * 100
                    )}% of total`
                  : "0%"}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Total Actions</p>
              <p className="text-2xl font-bold">{totalActions}</p>
              <p className="text-xs text-gray-500 mt-1">
                Across {sortedData.length} time periods
              </p>
            </div>
          </div>

          {/* Chart */}
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={sortedData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e6ecf5" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis
                  label={{
                    value: "Number of Actions",
                    angle: -90,
                    position: "insideLeft",
                    style: { textAnchor: "middle" },
                  }}
                />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="admin"
                  name="Admin Users"
                  fill="#1e386d"
                  stackId="a"
                />
                <Bar
                  dataKey="regular"
                  name="Regular Users"
                  fill="#e6ecf5"
                  stackId="a"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Description */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Analysis</h4>
            <p className="text-sm text-gray-600">
              This chart shows user activity broken down by user type (admin vs.
              regular users). Admin actions account for{" "}
              {totalActions > 0
                ? Math.round((totalAdmin / totalActions) * 100)
                : 0}
              % of all system activity. The data is aggregated by month to show
              activity trends over time.
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default UserActivityChart;
