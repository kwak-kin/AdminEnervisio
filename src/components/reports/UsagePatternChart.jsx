// src/components/reports/UsagePatternChart.jsx
import React, { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const UsagePatternChart = ({ data }) => {
  const [viewMode, setViewMode] = useState("stacked");

  // Sort data by date
  const sortedData = [...data].sort((a, b) => a.date - b.date);

  // Calculate totals
  const calculateTotals = () => {
    const morning = sortedData.reduce((sum, item) => sum + item.morning, 0);
    const afternoon = sortedData.reduce((sum, item) => sum + item.afternoon, 0);
    const evening = sortedData.reduce((sum, item) => sum + item.evening, 0);
    const night = sortedData.reduce((sum, item) => sum + item.night, 0);
    const total = morning + afternoon + evening + night;

    return {
      morning,
      afternoon,
      evening,
      night,
      total,
      morningPercent: total > 0 ? Math.round((morning / total) * 100) : 0,
      afternoonPercent: total > 0 ? Math.round((afternoon / total) * 100) : 0,
      eveningPercent: total > 0 ? Math.round((evening / total) * 100) : 0,
      nightPercent: total > 0 ? Math.round((night / total) * 100) : 0,
    };
  };

  const totals = calculateTotals();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[#1e386d]">
          Usage Patterns by Time of Day
        </h3>

        <div className="flex items-center space-x-2">
          <label
            htmlFor="viewMode"
            className="text-sm font-medium text-gray-700"
          >
            View Mode:
          </label>
          <select
            id="viewMode"
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
            className="form-input py-1 pl-2 pr-8"
          >
            <option value="stacked">Stacked</option>
            <option value="percent">Percentage</option>
            <option value="separate">Separate</option>
          </select>
        </div>
      </div>

      {sortedData.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No usage data available for the selected time period.
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Morning (6AM-12PM)</p>
              <p className="text-xl font-bold">{totals.morningPercent}%</p>
              <p className="text-xs text-gray-500 mt-1">
                Total: {totals.morning.toLocaleString()} kWh
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Afternoon (12PM-6PM)</p>
              <p className="text-xl font-bold">{totals.afternoonPercent}%</p>
              <p className="text-xs text-gray-500 mt-1">
                Total: {totals.afternoon.toLocaleString()} kWh
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Evening (6PM-12AM)</p>
              <p className="text-xl font-bold">{totals.eveningPercent}%</p>
              <p className="text-xs text-gray-500 mt-1">
                Total: {totals.evening.toLocaleString()} kWh
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Night (12AM-6AM)</p>
              <p className="text-xl font-bold">{totals.nightPercent}%</p>
              <p className="text-xs text-gray-500 mt-1">
                Total: {totals.night.toLocaleString()} kWh
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Total Usage</p>
              <p className="text-xl font-bold">
                {totals.total.toLocaleString()} kWh
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Across {sortedData.length} months
              </p>
            </div>
          </div>

          {/* Chart */}
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={sortedData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e6ecf5" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis
                  label={{
                    value:
                      viewMode === "percent" ? "Percentage (%)" : "Usage (kWh)",
                    angle: -90,
                    position: "insideLeft",
                    style: { textAnchor: "middle" },
                  }}
                />
                <Tooltip
                  formatter={(value, name) => [
                    viewMode === "percent" ? `${value}%` : `${value} kWh`,
                    name === "morning"
                      ? "Morning (6AM-12PM)"
                      : name === "afternoon"
                      ? "Afternoon (12PM-6PM)"
                      : name === "evening"
                      ? "Evening (6PM-12AM)"
                      : "Night (12AM-6AM)",
                  ]}
                />
                <Legend
                  formatter={(value) =>
                    value === "morning"
                      ? "Morning (6AM-12PM)"
                      : value === "afternoon"
                      ? "Afternoon (12PM-6PM)"
                      : value === "evening"
                      ? "Evening (6PM-12AM)"
                      : "Night (12AM-6AM)"
                  }
                />

                {viewMode === "stacked" && (
                  <>
                    <Area
                      type="monotone"
                      dataKey="morning"
                      name="morning"
                      stackId="1"
                      fill="#B8D9FA"
                      stroke="#7FB2F0"
                    />
                    <Area
                      type="monotone"
                      dataKey="afternoon"
                      name="afternoon"
                      stackId="1"
                      fill="#FFD875"
                      stroke="#FFC640"
                    />
                    <Area
                      type="monotone"
                      dataKey="evening"
                      name="evening"
                      stackId="1"
                      fill="#FF9B7A"
                      stroke="#FF7452"
                    />
                    <Area
                      type="monotone"
                      dataKey="night"
                      name="night"
                      stackId="1"
                      fill="#A5B3CC"
                      stroke="#8298BD"
                    />
                  </>
                )}

                {viewMode === "percent" && (
                  <>
                    <Area
                      type="monotone"
                      dataKey="morning"
                      name="morning"
                      stackId="1"
                      fill="#B8D9FA"
                      stroke="#7FB2F0"
                    />
                    <Area
                      type="monotone"
                      dataKey="afternoon"
                      name="afternoon"
                      stackId="1"
                      fill="#FFD875"
                      stroke="#FFC640"
                    />
                    <Area
                      type="monotone"
                      dataKey="evening"
                      name="evening"
                      stackId="1"
                      fill="#FF9B7A"
                      stroke="#FF7452"
                    />
                    <Area
                      type="monotone"
                      dataKey="night"
                      name="night"
                      stackId="1"
                      fill="#A5B3CC"
                      stroke="#8298BD"
                    />
                  </>
                )}

                {viewMode === "separate" && (
                  <>
                    <Area
                      type="monotone"
                      dataKey="morning"
                      name="morning"
                      fill="#B8D9FA"
                      stroke="#7FB2F0"
                    />
                    <Area
                      type="monotone"
                      dataKey="afternoon"
                      name="afternoon"
                      fill="#FFD875"
                      stroke="#FFC640"
                    />
                    <Area
                      type="monotone"
                      dataKey="evening"
                      name="evening"
                      fill="#FF9B7A"
                      stroke="#FF7452"
                    />
                    <Area
                      type="monotone"
                      dataKey="night"
                      name="night"
                      fill="#A5B3CC"
                      stroke="#8298BD"
                    />
                  </>
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Description */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Analysis</h4>
            <p className="text-sm text-gray-600">
              This chart shows energy usage patterns broken down by time of day.
              The highest consumption occurs during the evening hours (6PM-12AM)
              at {totals.eveningPercent}% of total usage, followed by afternoon
              (12PM-6PM) at {totals.afternoonPercent}%, morning (6AM-12PM) at{" "}
              {totals.morningPercent}%, and night (12AM-6AM) at{" "}
              {totals.nightPercent}%.
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default UsagePatternChart;
