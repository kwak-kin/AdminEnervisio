// src/components/reports/RateChart.jsx
import React from "react";
import { format } from "date-fns";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

const RateChart = ({ data }) => {
  // Sort data by date
  const sortedData = [...data].sort((a, b) => a.date - b.date);

  // Format data for chart
  const chartData = sortedData.map((item) => ({
    ...item,
    formattedDate: format(item.date, "MMM yyyy"),
  }));

  // Calculate statistics
  const calculateStats = () => {
    if (chartData.length === 0) return { min: 0, max: 0, avg: 0, change: 0 };

    const rates = chartData.map((item) => item.rate);
    const min = Math.min(...rates);
    const max = Math.max(...rates);
    const avg = rates.reduce((sum, rate) => sum + rate, 0) / rates.length;

    // Calculate change from first to last
    const first = chartData[0].rate;
    const last = chartData[chartData.length - 1].rate;
    const change = ((last - first) / first) * 100;

    // Calculate average
    const average = rates.reduce((sum, val) => sum + val, 0) / rates.length;

    return {
      min: min.toFixed(2),
      max: max.toFixed(2),
      avg: avg.toFixed(2),
      change: change.toFixed(2),
      average,
    };
  };

  const stats = calculateStats();

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-[#1e386d]">
        Electricity Rate Trends
      </h3>

      {chartData.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No rate data available for the selected time period.
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Minimum Rate</p>
              <p className="text-2xl font-bold">₱{stats.min}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Maximum Rate</p>
              <p className="text-2xl font-bold">₱{stats.max}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Average Rate</p>
              <p className="text-2xl font-bold">₱{stats.avg}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Overall Change</p>
              <p
                className={`text-2xl font-bold ${
                  parseFloat(stats.change) > 0
                    ? "text-[#dc3545]"
                    : parseFloat(stats.change) < 0
                    ? "text-[#28a745]"
                    : "text-gray-500"
                }`}
              >
                {parseFloat(stats.change) > 0 ? "+" : ""}
                {stats.change}%
              </p>
            </div>
          </div>

          {/* Chart */}
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e6ecf5" />
                <XAxis dataKey="formattedDate" tick={{ fontSize: 12 }} />
                <YAxis
                  domain={["auto", "auto"]}
                  label={{
                    value: "Rate (₱/kWh)",
                    angle: -90,
                    position: "insideLeft",
                    style: { textAnchor: "middle" },
                  }}
                />
                <Tooltip
                  formatter={(value) => [`₱${value.toFixed(2)}`, "Rate"]}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Legend />
                <ReferenceLine
                  y={stats.average}
                  stroke="#152951"
                  strokeDasharray="3 3"
                  label={{
                    value: "Average",
                    position: "right",
                    fill: "#152951",
                    fontSize: 12,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="rate"
                  name="Rate (₱/kWh)"
                  stroke="#1e386d"
                  activeDot={{ r: 8 }}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Description */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Analysis</h4>
            <p className="text-sm text-gray-600">
              This chart shows the electricity rate trends over time. The
              average rate is ₱{stats.avg} per kWh, with a{" "}
              {parseFloat(stats.change) >= 0 ? "rise" : "drop"} of{" "}
              {Math.abs(parseFloat(stats.change))}% over the period. The
              reference line shows the average rate across the entire period.
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default RateChart;
