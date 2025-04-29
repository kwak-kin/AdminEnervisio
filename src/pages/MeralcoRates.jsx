import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { db, getServerTimestamp, createTimestamp } from "../services/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  getDoc,
  doc,
  setDoc,
  addDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import RateForm from "../components/meralcoRate/RateForm";
import RateTable from "../components/meralcoRate/RateTable";
import RateHistory from "../components/meralcoRate/RateHistory";
import RateImpactAnalysis from "../components/meralcoRate/RateImpactAnalysis";
import BulkImportExport from "../components/meralcoRate/BulkImportExport";

const MeralcoRates = () => {
  const { currentUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [rates, setRates] = useState([]);
  const [currentRate, setCurrentRate] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedRate, setSelectedRate] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [activeTab, setActiveTab] = useState("current");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState({ start: null, end: null });

  // Get URL params
  const urlParams = new URLSearchParams(location.search);
  const actionParam = urlParams.get("action");

  useEffect(() => {
    // Check if we're being asked to create a new rate
    if (actionParam === "new") {
      setShowForm(true);
      setIsEditMode(false);
      setSelectedRate(null);
    }
  }, [actionParam]);

  const fetchRates = async (replace = true) => {
    try {
      setLoading(true);

      const ratesRef = collection(db, "meralcorate");
      let ratesQuery;

      // Base query
      if (activeTab === "current") {
        ratesQuery = query(
          ratesRef,
          where("archived", "==", false),
          orderBy("effective_from", "desc")
        );
      } else {
        ratesQuery = query(
          ratesRef,
          where("archived", "==", true),
          orderBy("effective_from", "desc")
        );
      }

      // Add date filters if set
      if (dateFilter.start && dateFilter.end) {
        const startDate = new Date(dateFilter.start);
        const endDate = new Date(dateFilter.end);
        endDate.setHours(23, 59, 59, 999); // Set to end of day

        ratesQuery = query(
          ratesRef,
          where("effective_from", ">=", createTimestamp(startDate)),
          where("effective_from", "<=", createTimestamp(endDate)),
          orderBy("effective_from", "desc")
        );
      }

      // Add pagination if this is not a fresh load
      if (!replace && lastDoc) {
        ratesQuery = query(ratesQuery, startAfter(lastDoc), limit(10));
      } else {
        ratesQuery = query(ratesQuery, limit(10));
      }

      const querySnapshot = await getDocs(ratesQuery);

      // Check if we have more results
      setHasMore(querySnapshot.docs.length === 10);

      // Save the last document for pagination
      if (querySnapshot.docs.length > 0) {
        setLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1]);
      } else {
        setLastDoc(null);
      }

      const ratesData = [];

      for (const doc of querySnapshot.docs) {
        const data = doc.data();
        let updatedByName = "Admin";

        // Get user who updated the rate
        try {
          const userDoc = await getDoc(doc(db, "users", data.updated_by));
          if (userDoc.exists()) {
            updatedByName = userDoc.data().display_name || "Admin";
          }
        } catch (error) {
          console.error("Error fetching user:", error);
        }

        ratesData.push({
          id: doc.id,
          rate: data.kwh_rate,
          effectiveFrom: data.effective_from?.toDate() || new Date(),
          updatedAt: data.updated_datetime?.toDate() || new Date(),
          updatedBy: updatedByName,
          archived: data.archived || false,
          notes: data.notes || "",
        });
      }

      if (replace) {
        setRates(ratesData);
      } else {
        setRates([...rates, ...ratesData]);
      }

      // Fetch the current rate if we're on the current tab
      if (activeTab === "current" && ratesData.length > 0) {
        setCurrentRate(ratesData[0]);
      }
    } catch (error) {
      console.error("Error fetching rates:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch current active rate
  const fetchCurrentRate = async () => {
    try {
      const ratesRef = collection(db, "meralcorate");
      const ratesQuery = query(
        ratesRef,
        where("archived", "==", false),
        orderBy("effective_from", "desc"),
        limit(1)
      );

      const querySnapshot = await getDocs(ratesQuery);

      if (!querySnapshot.empty) {
        const data = querySnapshot.docs[0].data();
        let updatedByName = "Admin";

        try {
          const userDoc = await getDoc(doc(db, "users", data.updated_by));
          if (userDoc.exists()) {
            updatedByName = userDoc.data().display_name || "Admin";
          }
        } catch (error) {
          console.error("Error fetching user:", error);
        }

        const currentRate = {
          id: querySnapshot.docs[0].id,
          rate: data.kwh_rate,
          effectiveFrom: data.effective_from?.toDate() || new Date(),
          updatedAt: data.updated_datetime?.toDate() || new Date(),
          updatedBy: updatedByName,
          archived: false,
          notes: data.notes || "",
        };

        setCurrentRate(currentRate);
        return currentRate;
      }

      return null;
    } catch (error) {
      console.error("Error fetching current rate:", error);
      return null;
    }
  };

  useEffect(() => {
    fetchRates();
    fetchCurrentRate();
  }, [activeTab, dateFilter]);

  const loadMore = () => {
    if (hasMore && !loading) {
      fetchRates(false);
    }
  };

  const handleAddNew = () => {
    setShowForm(true);
    setIsEditMode(false);
    setSelectedRate(null);
    // Update URL without full page reload
    navigate("/rates?action=new", { replace: true });
  };

  const handleEdit = (rate) => {
    setSelectedRate(rate);
    setIsEditMode(true);
    setShowForm(true);
  };

  const handleSubmit = async (data) => {
    try {
      // Start the transaction
      if (isEditMode && selectedRate) {
        // Update existing rate
        const baseRate = parseFloat(data.rate);
        const rate2 = baseRate + 0.56;
        const rate3 = rate2 + 0.62;
        const rateRef = doc(db, "meralcorate", selectedRate.id);
        await updateDoc(rateRef, {
          kwh_rate: baseRate,
          kwh_rate2: rate2,
          kwh_rate3: rate3,
          effective_from: createTimestamp(data.effectiveDate),
          updated_datetime: getServerTimestamp(),
          updated_by: currentUser.uid,
          notes: data.notes || "",
        });

        // Log to audit trail
        await addDoc(collection(db, "audittrail"), {
          action: "UPDATE",
          timestamp: getServerTimestamp(),
          uid: currentUser.uid,
          details: {
            entity: "meralcorate",
            id: selectedRate.id,
            old_kwh_rate: selectedRate.rate,
            new_kwh_rate: parseFloat(data.rate),
          },
        });
      } else {
        // Adding a new rate - archive existing rates first

        // 1. Find all non-archived rates
        const ratesRef = collection(db, "meralcorate");
        const currentRatesQuery = query(
          ratesRef,
          where("archived", "==", false)
        );

        const currentSnapshot = await getDocs(currentRatesQuery);

        // 2. Archive each existing current rate individually
        for (const rateDoc of currentSnapshot.docs) {
          // First archive the rate
          await updateDoc(doc(db, "meralcorate", rateDoc.id), {
            archived: true,
            updated_datetime: getServerTimestamp(),
            updated_by: currentUser.uid,
          });

          // Then log to audit trail
          await addDoc(collection(db, "audittrail"), {
            action: "ARCHIVE",
            timestamp: getServerTimestamp(),
            uid: currentUser.uid,
            details: {
              entity: "meralcorate",
              id: rateDoc.id,
              kwh_rate: rateDoc.data().kwh_rate,
              reason: "Replaced by new rate",
            },
          });
        }

        // 3. Create the new rate
        const baseRate = parseFloat(data.rate);
        const rate2 = baseRate + 0.62;
        const rate3 = rate2 + 0.56;
        const newRateRef = await addDoc(collection(db, "meralcorate"), {
          kwh_rate: baseRate,
          kwh_rate2: rate2,
          kwh_rate3: rate3,
          effective_from: createTimestamp(data.effectiveDate),
          updated_datetime: getServerTimestamp(),
          updated_by: currentUser.uid,
          archived: false,
          notes: data.notes || "",
        });

        // 4. Log to audit trail
        await addDoc(collection(db, "audittrail"), {
          action: "CREATE",
          timestamp: getServerTimestamp(),
          uid: currentUser.uid,
          details: {
            entity: "meralcorate",
            id: newRateRef.id,
            kwh_rate: parseFloat(data.rate),
          },
        });
      }

      // Reset form state and refresh rates
      setShowForm(false);
      setSelectedRate(null);
      setIsEditMode(false);
      fetchRates();
      fetchCurrentRate();

      // Update URL without full page reload
      navigate("/rates", { replace: true });
    } catch (error) {
      console.error("Error saving rate:", error);
      alert("Error saving rate: " + error.message);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setSelectedRate(null);
    setIsEditMode(false);

    // Update URL without full page reload
    navigate("/rates", { replace: true });
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const handleDateFilter = (start, end) => {
    setDateFilter({ start, end });
  };

  const filteredRates = rates.filter((rate) => {
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();
    return (
      rate.rate.toString().includes(searchLower) ||
      rate.effectiveFrom.toLocaleDateString().includes(searchLower) ||
      rate.updatedBy.toLowerCase().includes(searchLower) ||
      (rate.notes && rate.notes.toLowerCase().includes(searchLower))
    );
  });

  const tabs = [
    { id: "current", label: "Current Rate" },
    { id: "archived", label: "Archived Rates" },
    { id: "history", label: "Rate History" },
    { id: "analysis", label: "Impact Analysis" },
    { id: "import", label: "Import/Export" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1e386d]">
          Meralco Rate Management
        </h1>
        {!showForm && (
          <button
            onClick={handleAddNew}
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
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            Add New Rate
          </button>
        )}
      </div>

      {showForm ? (
        <div className="card">
          <h2 className="text-xl font-semibold text-[#1e386d] mb-4">
            {isEditMode ? "Edit Rate" : "Add New Rate"}
          </h2>
          <RateForm
            initialData={selectedRate}
            isEditMode={isEditMode}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        </div>
      ) : (
        <>
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

          {/* Current Rate Overview - Only show on current tab */}
          {activeTab === "current" && currentRate && (
            <div className="card bg-[#e6ecf5] border border-[#1e386d]">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                <div>
                  <h2 className="text-lg font-semibold text-[#1e386d]">
                    Current Electricity Rate
                  </h2>
                  <div className="flex items-baseline mt-1">
                    <span className="text-3xl font-bold text-[#1e386d]">
                      ₱{currentRate.rate.toFixed(2)}
                    </span>
                    <span className="ml-2 text-sm text-gray-600">per kWh</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Effective from:{" "}
                    {currentRate.effectiveFrom.toLocaleDateString()}
                  </p>
                </div>
                <div className="mt-4 md:mt-0">
                  <button
                    onClick={() => handleEdit(currentRate)}
                    className="bg-[#1e386d] text-white px-4 py-2 rounded font-medium hover:bg-[#152951] focus:outline-none focus:ring-2 focus:ring-[#1e386d] focus:ring-offset-2"
                  >
                    Edit Current Rate
                  </button>
                </div>
              </div>
              {currentRate.notes && (
                <div className="mt-4 p-2 bg-white rounded">
                  <p className="text-sm text-gray-700">{currentRate.notes}</p>
                </div>
              )}
            </div>
          )}

          {/* Tab content */}
          <div className="mt-4">
            {/* Current or Archived Rates */}
            {(activeTab === "current" || activeTab === "archived") && (
              <RateTable
                rates={filteredRates}
                loading={loading}
                hasMore={hasMore}
                loadMore={loadMore}
                onSearch={handleSearch}
                onDateFilter={handleDateFilter}
                onEdit={handleEdit}
                isArchived={activeTab === "archived"}
                showArchiveButton={false}
                showUnarchiveButton={false}
              />
            )}

            {/* Rate History */}
            {activeTab === "history" && <RateHistory />}

            {/* Impact Analysis */}
            {activeTab === "analysis" && <RateImpactAnalysis />}

            {/* Import/Export */}
            {activeTab === "import" && (
              <BulkImportExport onImportComplete={() => fetchRates()} />
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default MeralcoRates;
