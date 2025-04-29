// src/components/meralcoRate/RateHistory.jsx
import React, { useState, useEffect } from "react";
import { db, createTimestamp } from "../../services/firebase";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { Line } from "recharts";
import { format } from "date-fns";
import {
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const RateHistory = () => {
  const [loading, setLoading] = useState(true);
  const [rateHistory, setRateHistory] = useState([]);
  const [timeRange, setTimeRange] = useState("1year");

  useEffect(() => {
    const fetchRateHistory = async () => {
      try {
        setLoading(true);

        const ratesRef = collection(db, "meralcorate");
        const ratesQuery = query(ratesRef, orderBy("effective_from", "asc"));

        const querySnapshot = await getDocs(ratesQuery);

        const historyData = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            rate: data.kwh_rate,
            rate2: data.kwh_rate2 ?? data.kwh_rate + 0.56,
            rate3:
              data.kwh_rate3 ??
              (data.kwh_rate2
                ? data.kwh_rate2 + 0.62
                : data.kwh_rate + 0.56 + 0.62),
            date: data.effective_from?.toDate() || new Date(),
            formattedDate:
              data.effective_from?.toDate().toLocaleDateString() ||
              new Date().toLocaleDateString(),
          };
        });

        setRateHistory(historyData);
      } catch (error) {
        console.error("Error fetching rate history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRateHistory();
  }, []);

  const getFilteredData = () => {
    if (rateHistory.length === 0) return [];

    let cutoffDate = new Date();

    switch (timeRange) {
      case "3months":
        cutoffDate.setMonth(cutoffDate.getMonth() - 3);
        break;
      case "6months":
        cutoffDate.setMonth(cutoffDate.getMonth() - 6);
        break;
      case "1year":
        cutoffDate.setFullYear(cutoffDate.getFullYear() - 1);
        break;
      case "5years":
        cutoffDate.setFullYear(cutoffDate.getFullYear() - 5);
        break;
      case "all":
      default:
        cutoffDate = new Date(0); // Beginning of time
        break;
    }

    return rateHistory
      .filter((item) => item.date >= cutoffDate)
      .map((item) => ({
        ...item,
        formattedDate: format(item.date, "MMM yyyy"),
      }));
  };

  const chartData = getFilteredData();

  const calculateStats = () => {
    if (chartData.length === 0) return { min: 0, max: 0, avg: 0, change: 0 };

    const rates = chartData.map((item) => item.rate);
    const rates2 = chartData.map((item) => item.rate2);
    const rates3 = chartData.map((item) => item.rate3);
    const min = Math.min(...rates);
    const max = Math.max(...rates);
    const avg = rates.reduce((sum, rate) => sum + rate, 0) / rates.length;
    const min2 = Math.min(...rates2);
    const max2 = Math.max(...rates2);
    const avg2 = rates2.reduce((sum, rate) => sum + rate, 0) / rates2.length;
    const min3 = Math.min(...rates3);
    const max3 = Math.max(...rates3);
    const avg3 = rates3.reduce((sum, rate) => sum + rate, 0) / rates3.length;

    // Calculate change from first to last for each
    const first = chartData[0].rate;
    const last = chartData[chartData.length - 1].rate;
    const change = ((last - first) / first) * 100;
    const first2 = chartData[0].rate2;
    const last2 = chartData[chartData.length - 1].rate2;
    const change2 = ((last2 - first2) / first2) * 100;
    const first3 = chartData[0].rate3;
    const last3 = chartData[chartData.length - 1].rate3;
    const change3 = ((last3 - first3) / first3) * 100;

    return {
      min: min.toFixed(2),
      max: max.toFixed(2),
      avg: avg.toFixed(2),
      change: change.toFixed(2),
      min2: min2.toFixed(2),
      max2: max2.toFixed(2),
      avg2: avg2.toFixed(2),
      change2: change2.toFixed(2),
      min3: min3.toFixed(2),
      max3: max3.toFixed(2),
      avg3: avg3.toFixed(2),
      change3: change3.toFixed(2),
    };
  };

  const stats = calculateStats();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <h2 className="text-lg font-semibold text-[#1e386d]">
          Rate History Over Time
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
            <option value="3months">3 Months</option>
            <option value="6months">6 Months</option>
            <option value="1year">1 Year</option>
            <option value="5years">5 Years</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1e386d]"></div>
        </div>
      ) : chartData.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <p className="text-gray-500">
            No rate history data available for the selected time period.
          </p>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-md p-4">
              <p className="text-sm text-gray-500">Min Rate (200-399 kWh)</p>
              <p className="text-2xl font-bold">₱{stats.min}</p>
              <p className="text-xs text-gray-500">Change: {stats.change}%</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <p className="text-sm text-gray-500">Min Rate (400-799 kWh)</p>
              <p className="text-2xl font-bold">₱{stats.min2}</p>
              <p className="text-xs text-gray-500">Change: {stats.change2}%</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <p className="text-sm text-gray-500">Min Rate (800+ kWh)</p>
              <p className="text-2xl font-bold">₱{stats.min3}</p>
              <p className="text-xs text-gray-500">Change: {stats.change3}%</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <p className="text-sm text-gray-500">Avg Rate (All Brackets)</p>
              <p className="text-2xl font-bold">
                ₱{stats.avg} / ₱{stats.avg2} / ₱{stats.avg3}
              </p>
            </div>
          </div>

          {/* Chart */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
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
                  <Line
                    type="monotone"
                    dataKey="rate"
                    name="Rate (200-399 kWh)"
                    stroke="#1e386d"
                    activeDot={{ r: 8 }}
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="rate2"
                    name="Rate (400-799 kWh)"
                    stroke="#ffc107"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="rate3"
                    name="Rate (800+ kWh)"
                    stroke="#dc3545"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default RateHistory;
