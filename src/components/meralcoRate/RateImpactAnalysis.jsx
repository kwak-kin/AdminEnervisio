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

        // Fetch current and historical rates
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

  // Generate consumption data (mocked for demo)
  const generateConsumptionData = () => {
    const data = [];

    // Generate monthly consumption data for different user types
    for (let month = 1; month <= 12; month++) {
      data.push({
        month: `Month ${month}`,
        residential: Math.floor(Math.random() * 300) + 100, // 100-400 kWh
        commercial: Math.floor(Math.random() * 1000) + 500, // 500-1500 kWh
        industrial: Math.floor(Math.random() * 5000) + 2000, // 2000-7000 kWh
      });
    }

    return data;
  };

  // Calculate impact when simulated rate changes
  useEffect(() => {
    if (currentRate && simulatedRate) {
      const consumptionData = generateConsumptionData();

      // Calculate bill amounts and differences
      const impactData = consumptionData.map((item) => {
        const residentialCurrentBill = item.residential * currentRate;
        const residentialNewBill = item.residential * simulatedRate;
        const residentialDiff = residentialNewBill - residentialCurrentBill;

        const commercialCurrentBill = item.commercial * currentRate;
        const commercialNewBill = item.commercial * simulatedRate;
        const commercialDiff = commercialNewBill - commercialCurrentBill;

        const industrialCurrentBill = item.industrial * currentRate;
        const industrialNewBill = item.industrial * simulatedRate;
        const industrialDiff = industrialNewBill - industrialCurrentBill;

        return {
          ...item,
          residentialCurrentBill,
          residentialNewBill,
          residentialDiff,
          residentialPctChange:
            (residentialDiff / residentialCurrentBill) * 100,

          commercialCurrentBill,
          commercialNewBill,
          commercialDiff,
          commercialPctChange: (commercialDiff / commercialCurrentBill) * 100,

          industrialCurrentBill,
          industrialNewBill,
          industrialDiff,
          industrialPctChange: (industrialDiff / industrialCurrentBill) * 100,
        };
      });

      setImpactData(impactData);
    }
  }, [currentRate, simulatedRate]);

  // Calculate overall impact summary
  const calculateImpactSummary = () => {
    if (!impactData.length) return null;

    const residentialImpact = impactData.reduce(
      (sum, item) => sum + item.residentialDiff,
      0
    );
    const commercialImpact = impactData.reduce(
      (sum, item) => sum + item.commercialDiff,
      0
    );
    const industrialImpact = impactData.reduce(
      (sum, item) => sum + item.industrialDiff,
      0
    );
    const totalImpact = residentialImpact + commercialImpact + industrialImpact;

    const avgResidentialPct =
      impactData.reduce((sum, item) => sum + item.residentialPctChange, 0) /
      impactData.length;
    const avgCommercialPct =
      impactData.reduce((sum, item) => sum + item.commercialPctChange, 0) /
      impactData.length;
    const avgIndustrialPct =
      impactData.reduce((sum, item) => sum + item.industrialPctChange, 0) /
      impactData.length;

    return {
      residentialImpact,
      commercialImpact,
      industrialImpact,
      totalImpact,
      avgResidentialPct,
      avgCommercialPct,
      avgIndustrialPct,
    };
  };

  const impactSummary = calculateImpactSummary();

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
          {/* Rate Simulation Controls */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-md font-medium text-gray-900 mb-4">
              Rate Simulation
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="currentRate"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Current Rate (₱/kWh)
                </label>
                <input
                  type="text"
                  id="currentRate"
                  className="form-input bg-gray-100"
                  value={currentRate?.toFixed(2) || ""}
                  disabled
                />
              </div>

              <div>
                <label
                  htmlFor="simulatedRate"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Simulated Rate (₱/kWh)
                </label>
                <input
                  type="number"
                  id="simulatedRate"
                  className="form-input"
                  value={simulatedRate || ""}
                  onChange={(e) =>
                    setSimulatedRate(parseFloat(e.target.value) || 0)
                  }
                  step="0.01"
                  min="0"
                />
              </div>
            </div>

            <div className="mt-4">
              <p className="text-sm text-gray-500">
                Adjust the simulated rate to see the impact on different
                customer types. The current analysis shows a change from ₱
                {currentRate?.toFixed(2) || "0.00"} to ₱
                {simulatedRate?.toFixed(2) || "0.00"} per kWh.
              </p>
            </div>
          </div>

          {/* Impact Summary */}
          {impactSummary && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow-md p-4">
                <p className="text-sm text-gray-500">Residential Impact</p>
                <p
                  className={`text-2xl font-bold ${
                    impactSummary.residentialImpact >= 0
                      ? "text-[#dc3545]"
                      : "text-[#28a745]"
                  }`}
                >
                  {impactSummary.residentialImpact >= 0 ? "+" : ""}₱
                  {impactSummary.residentialImpact.toLocaleString("en-US", {
                    maximumFractionDigits: 2,
                  })}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {impactSummary.avgResidentialPct.toFixed(2)}% change
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-4">
                <p className="text-sm text-gray-500">Commercial Impact</p>
                <p
                  className={`text-2xl font-bold ${
                    impactSummary.commercialImpact >= 0
                      ? "text-[#dc3545]"
                      : "text-[#28a745]"
                  }`}
                >
                  {impactSummary.commercialImpact >= 0 ? "+" : ""}₱
                  {impactSummary.commercialImpact.toLocaleString("en-US", {
                    maximumFractionDigits: 2,
                  })}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {impactSummary.avgCommercialPct.toFixed(2)}% change
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-4">
                <p className="text-sm text-gray-500">Industrial Impact</p>
                <p
                  className={`text-2xl font-bold ${
                    impactSummary.industrialImpact >= 0
                      ? "text-[#dc3545]"
                      : "text-[#28a745]"
                  }`}
                >
                  {impactSummary.industrialImpact >= 0 ? "+" : ""}₱
                  {impactSummary.industrialImpact.toLocaleString("en-US", {
                    maximumFractionDigits: 2,
                  })}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {impactSummary.avgIndustrialPct.toFixed(2)}% change
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-4">
                <p className="text-sm text-gray-500">Total Impact</p>
                <p
                  className={`text-2xl font-bold ${
                    impactSummary.totalImpact >= 0
                      ? "text-[#dc3545]"
                      : "text-[#28a745]"
                  }`}
                >
                  {impactSummary.totalImpact >= 0 ? "+" : ""}₱
                  {impactSummary.totalImpact.toLocaleString("en-US", {
                    maximumFractionDigits: 2,
                  })}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Across all customer types
                </p>
              </div>
            </div>
          )}

          {/* Impact Chart */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-md font-medium text-gray-900 mb-4">
              Monthly Bill Impact by Customer Type
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
                      value: "Bill Impact (₱)",
                      angle: -90,
                      position: "insideLeft",
                      style: { textAnchor: "middle" },
                    }}
                  />
                  <Tooltip
                    formatter={(value) => [`₱${value.toFixed(2)}`, ""]}
                    labelFormatter={(label) => `Month: ${label}`}
                  />
                  <Legend />
                  <ReferenceLine y={0} stroke="#000" />
                  <Line
                    type="monotone"
                    dataKey="residentialDiff"
                    name="Residential"
                    stroke="#1e386d"
                    activeDot={{ r: 8 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="commercialDiff"
                    name="Commercial"
                    stroke="#ffc107"
                    activeDot={{ r: 8 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="industrialDiff"
                    name="Industrial"
                    stroke="#28a745"
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Impact Recommendation */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-md font-medium text-gray-900 mb-2">
              Impact Analysis Recommendation
            </h3>

            {impactSummary && (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  {simulatedRate > currentRate
                    ? `Increasing the rate from ₱${currentRate?.toFixed(
                        2
                      )} to ₱${simulatedRate?.toFixed(2)} 
                    per kWh will result in an estimated total increase of 
                    ₱${impactSummary.totalImpact.toLocaleString("en-US", {
                      maximumFractionDigits: 2,
                    })} 
                    across all customer types.`
                    : simulatedRate < currentRate
                    ? `Decreasing the rate from ₱${currentRate?.toFixed(
                        2
                      )} to ₱${simulatedRate?.toFixed(2)} 
                    per kWh will result in an estimated total decrease of 
                    ₱${Math.abs(impactSummary.totalImpact).toLocaleString(
                      "en-US",
                      { maximumFractionDigits: 2 }
                    )} 
                    across all customer types.`
                    : "No change in rates means no impact on customer bills."}
                </p>

                <p className="text-sm text-gray-600">
                  The greatest impact will be on
                  {Math.abs(impactSummary.industrialImpact) >
                    Math.abs(impactSummary.commercialImpact) &&
                  Math.abs(impactSummary.industrialImpact) >
                    Math.abs(impactSummary.residentialImpact)
                    ? " industrial customers"
                    : Math.abs(impactSummary.commercialImpact) >
                      Math.abs(impactSummary.residentialImpact)
                    ? " commercial customers"
                    : " residential customers"}
                  .
                </p>

                <p className="text-sm text-gray-600 font-medium mt-4">
                  {Math.abs(impactSummary.avgResidentialPct) > 10
                    ? "This rate change may have a significant impact on residential customers. Consider implementing the change gradually."
                    : "The impact on residential customers appears manageable."}
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
