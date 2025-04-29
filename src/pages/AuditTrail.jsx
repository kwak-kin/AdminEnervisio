import React, { useState, useEffect } from "react";
import { db } from "../services/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  getDoc,
  doc,
  startAfter,
  endBefore,
  limitToLast,
} from "firebase/firestore";
import AuditFilters from "../components/auditTrail/AuditFilters";
import AuditTable from "../components/auditTrail/AuditTable";
import AuditExport from "../components/auditTrail/AuditExport";

const AuditTrail = () => {
  const [loading, setLoading] = useState(true);
  const [auditRecords, setAuditRecords] = useState([]);
  const [showExport, setShowExport] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  // Navigation cache to store documents for pagination
  const [paginationCache, setPaginationCache] = useState({});

  // Sorting state (default is descending - newest first)
  const [sortOrder, setSortOrder] = useState("desc");

  // Filter states
  const [filters, setFilters] = useState({
    dateRange: { start: null, end: null },
    actionType: "",
    userId: "",
    detailsContent: "",
  });

  // Function to estimate total pages based on query
  const estimateTotalPages = async (baseQuery) => {
    try {
      // This is a simple estimation - for production apps, consider using a counter or other methods
      // to get accurate counts without fetching all documents
      const countQuery = baseQuery;
      const snapshot = await getDocs(countQuery);

      // Apply local filter for details content if needed
      let filteredCount = snapshot.size;

      if (filters.detailsContent) {
        const filteredDocs = snapshot.docs.filter((doc) => {
          const data = doc.data();
          if (data.details) {
            const detailsString = JSON.stringify(data.details).toLowerCase();
            return detailsString.includes(filters.detailsContent.toLowerCase());
          }
          return false;
        });
        filteredCount = filteredDocs.length;
      }

      setTotalRecords(filteredCount);
      const calculatedTotalPages = Math.ceil(filteredCount / pageSize);
      setTotalPages(calculatedTotalPages > 0 ? calculatedTotalPages : 1);
    } catch (error) {
      console.error("Error estimating total pages:", error);
      setTotalPages(1); // Default to 1 page on error
    }
  };

  // Function to build the Firestore query based on filters
  const buildQuery = (page = 1) => {
    const auditRef = collection(db, "audittrail");

    // Start with base query with sort order
    let auditQuery = query(auditRef, orderBy("timestamp", sortOrder));

    // Apply date range filter
    if (filters.dateRange.start && filters.dateRange.end) {
      const startDate = new Date(filters.dateRange.start);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(filters.dateRange.end);
      endDate.setHours(23, 59, 59, 999);

      auditQuery = query(
        auditQuery,
        where("timestamp", ">=", startDate),
        where("timestamp", "<=", endDate)
      );
    }

    // Apply action type filter
    if (filters.actionType) {
      auditQuery = query(auditQuery, where("action", "==", filters.actionType));
    }

    // Apply user ID filter
    if (filters.userId) {
      auditQuery = query(auditQuery, where("uid", "==", filters.userId));
    }

    // Apply pagination
    // Use cached documents for pagination if available
    if (page > 1 && paginationCache[page - 1]) {
      // Next page (forward pagination)
      auditQuery = query(
        auditQuery,
        startAfter(paginationCache[page - 1]),
        limit(pageSize)
      );
    } else if (page < currentPage && paginationCache[page]) {
      // Previous page (backward pagination)
      auditQuery = query(
        auditQuery,
        endBefore(paginationCache[page]),
        limitToLast(pageSize)
      );
    } else {
      // First page or reset
      auditQuery = query(auditQuery, limit(pageSize));
    }

    return auditQuery;
  };

  // Function to fetch audit records
  const fetchAuditRecords = async (page = 1) => {
    try {
      setLoading(true);
      const auditQuery = buildQuery(page);

      // First, estimate total pages if we're on page 1 or refreshing
      if (page === 1) {
        const baseQuery = query(collection(db, "audittrail"));
        await estimateTotalPages(baseQuery);
      }

      const querySnapshot = await getDocs(auditQuery);

      // Save the last document for pagination caching
      if (querySnapshot.docs.length > 0) {
        // Update pagination cache with last document
        setPaginationCache((prev) => ({
          ...prev,
          [page]: querySnapshot.docs[querySnapshot.docs.length - 1],
        }));
      }

      const records = [];

      // Process each document
      for (const doc of querySnapshot.docs) {
        const data = doc.data();

        // Skip if details content filter is applied and not matched
        if (filters.detailsContent && data.details) {
          const detailsString = JSON.stringify(data.details).toLowerCase();
          if (!detailsString.includes(filters.detailsContent.toLowerCase())) {
            continue;
          }
        }

        // Get user name or id for display
        let userName = data.uid; // Always use uid, even for admins

        records.push({
          id: doc.id,
          action: data.action,
          timestamp: data.timestamp?.toDate() || new Date(),
          uid: data.uid,
          userName: userName,
          details: data.details || {},
        });
      }

      setAuditRecords(records);
      setCurrentPage(page);
    } catch (error) {
      console.error("Error fetching audit records:", error);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and when filters, sort order or page size changes
  useEffect(() => {
    // Reset pagination cache when filters, sort order or page size changes
    setPaginationCache({});
    setCurrentPage(1);
    fetchAuditRecords(1);
  }, [filters, sortOrder, pageSize]);

  // Handle filter changes
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  // Handle page change
  const handlePageChange = (page) => {
    if (page !== currentPage && page >= 1 && page <= totalPages) {
      fetchAuditRecords(page);
    }
  };

  // Handle sort order change
  const handleSortOrderChange = (newOrder) => {
    setSortOrder(newOrder);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1e386d]">Audit Trail</h1>
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
          Export Data
        </button>
      </div>

      {/* Export Panel */}
      {showExport && (
        <div className="card">
          <AuditExport filters={filters} sortOrder={sortOrder} />
        </div>
      )}

      {/* Filters */}
      <div className="card">
        <h2 className="text-lg font-semibold text-[#1e386d] mb-4">Filters</h2>
        <AuditFilters filters={filters} onFilterChange={handleFilterChange} />
      </div>

      {/* Results */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-[#1e386d]">
            Results {totalRecords > 0 ? `(${totalRecords} records)` : ""}
          </h2>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Sort order:</span>
            <select
              className="form-input py-1 pl-2 pr-8"
              value={sortOrder}
              onChange={(e) => handleSortOrderChange(e.target.value)}
            >
              <option value="desc">Newest first</option>
              <option value="asc">Oldest first</option>
            </select>

            <span className="text-sm text-gray-600 ml-4">
              Records per page:
            </span>
            <select
              className="form-input py-1 pl-2 pr-8"
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
        </div>

        <AuditTable
          records={auditRecords}
          loading={loading}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          sortOrder={sortOrder}
          onSortOrderChange={handleSortOrderChange}
        />
      </div>
    </div>
  );
};

export default AuditTrail;
