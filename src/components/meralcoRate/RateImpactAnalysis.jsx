import React, { useState, useEffect } from "react";
import { db } from "../../services/firebase";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
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

const RateImpactAnalysis = () => {
  const [loading, setLoading] = useState(true);
  const [rateData, setRateData] = useState([]);
  const [currentRate, setCurrentRate] = useState(null);
  const [simulatedRate, setSimulatedRate] = useState(null);
  const [impactData, setImpactData] = useState([]);

  // Fetch historical rate data
  useEffect(() => {
    const fetchRateData = async () => {
      try {
        setLoading(true);
        const ratesRef = collection(db, "meralcorate");
        const ratesQuery = query(
          ratesRef,
          orderBy("effective_from", "desc"),
          limit(10)
        );
        const querySnapshot = await getDocs(ratesQuery);
        if (!querySnapshot.empty) {
          const rates = querySnapshot.docs.map((doc) => {
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
              archived: data.archived || false,
            };
          });
          setRateData(rates);
          // Set current rate
          const current = rates.find((r) => !r.archived);
          if (current) {
            setCurrentRate(current.rate);
            setSimulatedRate(current.rate);
          }
        }
      } catch (error) {
        console.error("Error fetching rate data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRateData();
  }, []);

  // Generate residential consumption data for each bracket
  const generateResidentialConsumptionData = () => {
    const data = [];
    for (let month = 1; month <= 12; month++) {
      // Simulate household consumption for each bracket
      data.push({
        month: `Month ${month}`,
        kwh_200_399: Math.floor(Math.random() * 200) + 200, // 200-399
        kwh_400_799: Math.floor(Math.random() * 400) + 400, // 400-799
        kwh_800_up: Math.floor(Math.random() * 400) + 800, // 800-1199
      });
    }
    return data;
  };

  useEffect(() => {
    if (currentRate != null) {
      const base = currentRate;
      const rate2 = rateData[0]?.rate2 ?? base + 0.56;
      const rate3 = rateData[0]?.rate3 ?? rate2 + 0.62;
      const consumptionData = generateResidentialConsumptionData();
      const impactData = consumptionData.map((item) => {
        const bill1 = item.kwh_200_399 * base;
        const bill2 = item.kwh_400_799 * rate2;
        const bill3 = item.kwh_800_up * rate3;
        return {
          ...item,
          bill_200_399: bill1,
          bill_400_799: bill2,
          bill_800_up: bill3,
        };
      });
      setImpactData(impactData);
    }
  }, [currentRate, rateData]);

  // Calculate summary for each bracket
  const calculateBracketSummary = () => {
    if (!impactData.length) return null;
    const sum = (arr, key) => arr.reduce((acc, item) => acc + item[key], 0);
    return {
      total_200_399: sum(impactData, "bill_200_399"),
      total_400_799: sum(impactData, "bill_400_799"),
      total_800_up: sum(impactData, "bill_800_up"),
      avg_200_399: sum(impactData, "bill_200_399") / impactData.length,
      avg_400_799: sum(impactData, "bill_400_799") / impactData.length,
      avg_800_up: sum(impactData, "bill_800_up") / impactData.length,
    };
  };
  const bracketSummary = calculateBracketSummary();

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-[#1e386d] mb-4">
        Rate Impact Analysis
      </h2>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1e386d]"></div>
        </div>
      ) : (
        <>
          {/* Rate Bracket Summary */}
          {bracketSummary && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg shadow-md p-4">
                <p className="text-sm text-gray-500 font-semibold">
                  200-399 kWh
                </p>
                <p className="text-2xl font-bold">
                  ₱
                  {bracketSummary.avg_200_399.toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Avg. monthly bill (200-399kWh consumption)
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-4">
                <p className="text-sm text-gray-500 font-semibold">
                  400-799 kWh
                </p>
                <p className="text-2xl font-bold">
                  ₱
                  {bracketSummary.avg_400_799.toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Avg. monthly bill (400-799kWh consumption)
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-4">
                <p className="text-sm text-gray-500 font-semibold">800+ kWh</p>
                <p className="text-2xl font-bold">
                  ₱
                  {bracketSummary.avg_800_up.toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Avg. monthly bill (800+ kWh consumption)
                </p>
              </div>
            </div>
          )}

          {/* Chart */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-md font-medium text-gray-900 mb-4">
              Residential Bill Impact by Consumption Bracket
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={impactData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis
                    label={{
                      value: "Bill (₱)",
                      angle: -90,
                      position: "insideLeft",
                      style: { textAnchor: "middle" },
                    }}
                  />
                  <Tooltip
                    formatter={(value) => [
                      `₱${value.toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })}`,
                      "",
                    ]}
                    labelFormatter={(label) => `Month: ${label}`}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="bill_200_399"
                    name="200-399 kWh"
                    stroke="#1e386d"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="bill_400_799"
                    name="400-799 kWh"
                    stroke="#ffc107"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="bill_800_up"
                    name="800+ kWh"
                    stroke="#dc3545"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recommendation */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-md font-medium text-gray-900 mb-2">
              Recommendation
            </h3>
            {bracketSummary && (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  For households consuming 200-399 kWh, the average monthly bill
                  is lowest, but as consumption increases to 400-799 kWh and
                  above 800 kWh, the bill increases significantly due to higher
                  rates. Consider educating users about the impact of higher
                  consumption brackets and encourage energy-saving habits.
                </p>
                <p className="text-sm text-gray-600 font-medium mt-2">
                  Recommendation: Display bracketed rates clearly in the mobile
                  app and provide tips for staying within lower consumption
                  brackets to help users save on their electricity bills.
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default RateImpactAnalysis;
