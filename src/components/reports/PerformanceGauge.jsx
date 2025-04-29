// src/components/reports/PerformanceGauge.jsx
import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

const PerformanceGauge = ({ data }) => {
  // Create gauge data
  const createGaugeData = (value, max, name) => {
    return [
      { name, value, color: getColorByPerformance(value, name) },
      { name: "remainder", value: max - value, color: "#E0E0E0" },
    ];
  };

  // Get color based on metric and value
  const getColorByPerformance = (value, metric) => {
    if (metric === "uptime") {
      return value >= 99.9 ? "#28a745" : value >= 99 ? "#ffc107" : "#dc3545";
    } else if (metric === "responseTime") {
      // Lower is better for response time
      return value <= 200 ? "#28a745" : value <= 500 ? "#ffc107" : "#dc3545";
    } else if (metric === "errorRate") {
      // Lower is better for error rate
      return value <= 0.5 ? "#28a745" : value <= 2 ? "#ffc107" : "#dc3545";
    } else if (metric === "userSatisfaction") {
      return value >= 4.5 ? "#28a745" : value >= 3.5 ? "#ffc107" : "#dc3545";
    }
    return "#1e386d";
  };

  // Get label text for gauge
  const getGaugeLabel = (value, metric) => {
    if (metric === "uptime") {
      return `${value}%`;
    } else if (metric === "responseTime") {
      return `${value}ms`;
    } else if (metric === "errorRate") {
      return `${value}%`;
    } else if (metric === "userSatisfaction") {
      return `${value}/5`;
    }
    return value;
  };

  // Get appropriate max value for each metric
  const getMaxValue = (metric) => {
    if (metric === "uptime") return 100;
    if (metric === "responseTime") return 1000;
    if (metric === "errorRate") return 5;
    if (metric === "userSatisfaction") return 5;
    return 100;
  };

  // Format metrics for display
  const metrics = [
    {
      name: "uptime",
      label: "System Uptime",
      value: data.uptime,
      max: getMaxValue("uptime"),
      description: "Percentage of time the system was operational",
    },
    {
      name: "responseTime",
      label: "Avg. Response Time",
      value: data.responseTime,
      max: getMaxValue("responseTime"),
      description: "Average time in milliseconds to respond to requests",
    },
    {
      name: "errorRate",
      label: "Error Rate",
      value: data.errorRate,
      max: getMaxValue("errorRate"),
      description: "Percentage of requests resulting in errors",
    },
    {
      name: "userSatisfaction",
      label: "User Satisfaction",
      value: data.userSatisfaction,
      max: getMaxValue("userSatisfaction"),
      description: "Average user rating out of 5",
    },
  ];

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-[#1e386d]">
        System Performance Metrics
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {metrics.map((metric) => (
          <div
            key={metric.name}
            className="bg-white border border-gray-200 rounded-lg shadow-sm p-4"
          >
            <div className="flex flex-col items-center">
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                {metric.label}
              </h4>

              <div className="h-40 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={createGaugeData(
                        metric.value,
                        metric.max,
                        metric.name
                      )}
                      cx="50%"
                      cy="50%"
                      startAngle={180}
                      endAngle={0}
                      innerRadius="60%"
                      outerRadius="80%"
                      paddingAngle={0}
                      dataKey="value"
                    >
                      {createGaugeData(
                        metric.value,
                        metric.max,
                        metric.name
                      ).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => [
                        name === "remainder"
                          ? null
                          : getGaugeLabel(value, metric.name),
                        name === "remainder" ? null : metric.label,
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="text-center mt-2">
                <p
                  className="text-3xl font-bold"
                  style={{
                    color: getColorByPerformance(metric.value, metric.name),
                  }}
                >
                  {getGaugeLabel(metric.value, metric.name)}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {metric.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Overall Performance Summary */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">Performance Summary</h4>
        <p className="text-sm text-gray-600">
          The system is currently operating at {data.uptime}% uptime with an
          average response time of {data.responseTime}ms. The error rate is{" "}
          {data.errorRate}%, and user satisfaction rating is{" "}
          {data.userSatisfaction}/5.
          {data.uptime >= 99.9 &&
          data.responseTime <= 300 &&
          data.errorRate <= 1 &&
          data.userSatisfaction >= 4.5
            ? " Overall system performance is excellent."
            : data.uptime >= 99 &&
              data.responseTime <= 500 &&
              data.errorRate <= 2 &&
              data.userSatisfaction >= 4
            ? " Overall system performance is good."
            : " Some performance metrics require attention."}
        </p>
      </div>
    </div>
  );
};

export default PerformanceGauge;
