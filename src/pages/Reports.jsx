import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { db } from "../services/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import RateChart from "../components/reports/RateChart";
import UserActivityChart from "../components/reports/UserActivityChart";
import UsagePatternChart from "../components/reports/UsagePatternChart";
import PerformanceGauge from "../components/reports/PerformanceGauge";
import ReportExport from "../components/reports/ReportExport";

const Reports = () => {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("rates");
  const [showExport, setShowExport] = useState(false);
  const [timeRange, setTimeRange] = useState("1year");
  const [chartData, setChartData] = useState({
    rates: [],
    userActivity: [],
    usagePatterns: [],
    performance: {
      uptime: 99.8,
      responseTime: 250,
      errorRate: 0.5,
      userSatisfaction: 4.7,
    },
  });

  // Get URL params
  const urlParams = new URLSearchParams(location.search);
  const actionParam = urlParams.get("action");

  useEffect(() => {
    // Check if we're being asked to show export
    if (actionParam === "export") {
      setShowExport(true);
    }
  }, [actionParam]);

  // Function to get date for time range
  const getDateFromRange = (range) => {
    const now = new Date();
    switch (range) {
      case "1month":
        return new Date(now.setMonth(now.getMonth() - 1));
      case "3months":
        return new Date(now.setMonth(now.getMonth() - 3));
      case "6months":
        return new Date(now.setMonth(now.getMonth() - 6));
      case "1year":
        return new Date(now.setFullYear(now.getFullYear() - 1));
      case "all":
      default:
        return new Date(0); // Beginning of time
    }
  };

  // Fetch data for charts
  const fetchChartData = async () => {
    try {
      setLoading(true);

      const startDate = getDateFromRange(timeRange);
      const startTimestamp = Timestamp.fromDate(startDate);

      // Fetch rate data
      const ratesRef = collection(db, "meralcorate");
      const ratesQuery = query(
        ratesRef,
        where("effective_from", ">=", startTimestamp),
        orderBy("effective_from", "asc")
      );

      const ratesSnapshot = await getDocs(ratesQuery);
      const ratesData = ratesSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          rate: data.kwh_rate,
          date: data.effective_from?.toDate() || new Date(),
          archived: data.archived || false,
        };
      });

      // Fetch user activity data (audit trail)
      const auditRef = collection(db, "audittrail");
      const auditQuery = query(
        auditRef,
        where("timestamp", ">=", startTimestamp),
        orderBy("timestamp", "asc")
      );

      const auditSnapshot = await getDocs(auditQuery);

      // Group actions by type and user type
      const userActivity = {};

      for (const doc of auditSnapshot.docs) {
        const data = doc.data();
        const date = data.timestamp?.toDate() || new Date();
        const month = date.toLocaleString("default", {
          month: "short",
          year: "numeric",
        });

        // We'll differentiate between admin and regular user actions
        // Assuming user type is determined by checking in users collection (simplified here)
        const userType = data.uid ? "admin" : "regular"; // Simplified for example

        if (!userActivity[month]) {
          userActivity[month] = { admin: 0, regular: 0, date };
        }

        userActivity[month][userType]++;
      }

      // Convert to array for chart
      const userActivityData = Object.entries(userActivity)
        .map(([month, data]) => ({
          month,
          admin: data.admin,
          regular: data.regular,
          date: data.date,
        }))
        .sort((a, b) => a.date - b.date);

      // For the usage patterns, we'd normally fetch actual usage data
      // For this example, we'll generate mock data
      const usagePatterns = generateMockUsageData(startDate);

      setChartData({
        rates: ratesData,
        userActivity: userActivityData,
        usagePatterns,
        performance: {
          uptime: 99.8,
          responseTime: 250,
          errorRate: 0.5,
          userSatisfaction: 4.7,
        },
      });
    } catch (error) {
      console.error("Error fetching chart data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Generate mock usage data
  const generateMockUsageData = (startDate) => {
    const data = [];
    const now = new Date();
    const current = new Date(startDate);

    // Generate monthly data
    while (current <= now) {
      const month = current.toLocaleString("default", {
        month: "short",
        year: "numeric",
      });

      data.push({
        month,
        date: new Date(current),
        morning: Math.floor(Math.random() * 300) + 200,
        afternoon: Math.floor(Math.random() * 500) + 300,
        evening: Math.floor(Math.random() * 700) + 400,
        night: Math.floor(Math.random() * 200) + 100,
      });

      current.setMonth(current.getMonth() + 1);
    }

    return data;
  };

  // Fetch data when time range changes
  useEffect(() => {
    fetchChartData();
  }, [timeRange]);

  // Tabs for different charts
  const tabs = [
    { id: "rates", label: "Rate Trends" },
    { id: "users", label: "User Activity" },
    { id: "usage", label: "Usage Patterns" },
    { id: "performance", label: "System Performance" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1e386d]">
          Reports & Analytics
        </h1>
        <button
          onClick={() => setShowExport(!showExport)}
          className="bg-[#1e386d] text-white px-4 py-2 rounded font-medium hover:bg-[#152951] focus:outline-none focus:ring-2 focus:ring-[#1e386d] focus:ring-offset-2 flex items-center"
        >
          <svg
            className="h-5 w-5 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Export Report
        </button>
      </div>

      {/* Export Panel */}
      {showExport && (
        <div className="card">
          <ReportExport
            chartData={chartData}
            activeTab={activeTab}
            onClose={() => setShowExport(false)}
          />
        </div>
      )}

      {/* Time Range Selector */}
      <div className="card">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#1e386d]">
            Data Visualization
          </h2>

          <div className="flex items-center space-x-2">
            <label
              htmlFor="timeRange"
              className="text-sm font-medium text-gray-700"
            >
              Time Range:
            </label>
            <select
              id="timeRange"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="form-input py-1 pl-2 pr-8"
            >
              <option value="1month">Last Month</option>
              <option value="3months">Last 3 Months</option>
              <option value="6months">Last 6 Months</option>
              <option value="1year">Last Year</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? "border-[#1e386d] text-[#1e386d]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Chart Content */}
      <div className="card">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1e386d]"></div>
          </div>
        ) : (
          <>
            {activeTab === "rates" && <RateChart data={chartData.rates} />}

            {activeTab === "users" && (
              <UserActivityChart data={chartData.userActivity} />
            )}

            {activeTab === "usage" && (
              <UsagePatternChart data={chartData.usagePatterns} />
            )}

            {activeTab === "performance" && (
              <PerformanceGauge data={chartData.performance} />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Reports;
