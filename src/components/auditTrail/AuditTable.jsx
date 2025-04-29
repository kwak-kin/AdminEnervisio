// src/components/auditTrail/AuditTable.jsx
import React, { useState } from "react";

const AuditTable = ({
  records,
  loading,
  currentPage,
  totalPages,
  onPageChange,
  sortOrder,
  onSortOrderChange,
}) => {
  const [expandedRows, setExpandedRows] = useState(new Set());

  // Toggle row expansion
  const toggleRowExpand = (id) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  // Format details object for display
  const formatDetails = (details) => {
    if (!details || Object.keys(details).length === 0) {
      return "No additional details";
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {Object.entries(details).map(([key, value]) => (
          <div key={key} className="flex">
            <span className="font-medium mr-2">{key.replace(/_/g, " ")}:</span>
            <span className="text-gray-600">
              {typeof value === "object"
                ? JSON.stringify(value)
                : String(value)}
            </span>
          </div>
        ))}
      </div>
    );
  };

  // Get action badge style
  const getActionBadgeStyle = (action) => {
    switch (action) {
      case "LOGIN":
        return "bg-blue-100 text-blue-800";
      case "LOGOUT":
        return "bg-gray-100 text-gray-800";
      case "CREATE":
        return "bg-green-100 text-green-800";
      case "UPDATE":
        return "bg-yellow-100 text-yellow-800";
      case "DELETE":
      case "ARCHIVE":
        return "bg-red-100 text-red-800";
      case "UNARCHIVE":
        return "bg-purple-100 text-purple-800";
      case "FAILED_LOGIN":
        return "bg-red-100 text-red-800";
      case "PASSWORD_RESET_REQUEST":
        return "bg-indigo-100 text-indigo-800";
      case "EXPORT":
        return "bg-teal-100 text-teal-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Render sort indicator based on current sort order
  const renderSortIndicator = () => {
    return sortOrder === "desc" ? (
      <svg
        className="w-4 h-4 ml-1"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M19 9l-7 7-7-7"
        />
      </svg>
    ) : (
      <svg
        className="w-4 h-4 ml-1"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M5 15l7-7 7 7"
        />
      </svg>
    );
  };

  return (
    <div>
      {/* Loading state */}
      {loading && records.length === 0 ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1e386d]"></div>
        </div>
      ) : records.length === 0 ? (
        <div className="bg-gray-50 p-6 text-center rounded-md">
          <p className="text-gray-500">
            No audit records found for the selected filters.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() =>
                    onSortOrderChange(sortOrder === "asc" ? "desc" : "asc")
                  }
                >
                  <div className="flex items-center">
                    Timestamp
                    {renderSortIndicator()}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Action
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  User
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {records.map((record) => (
                <React.Fragment key={record.id}>
                  <tr
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => toggleRowExpand(record.id)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.timestamp.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getActionBadgeStyle(
                          record.action
                        )}`}
                      >
                        {record.action.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.userName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        className="text-[#1e386d] hover:text-[#152951]"
                        aria-expanded={expandedRows.has(record.id)}
                      >
                        {expandedRows.has(record.id)
                          ? "Hide Details"
                          : "View Details"}
                      </button>
                    </td>
                  </tr>
                  {expandedRows.has(record.id) && (
                    <tr className="bg-gray-50">
                      <td
                        colSpan="4"
                        className="px-6 py-4 text-sm text-gray-500"
                      >
                        <div className="border-t border-gray-200 pt-3">
                          <h4 className="text-sm font-medium text-gray-900 mb-2">
                            Detailed Information:
                          </h4>
                          {formatDetails(record.details)}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination controls */}
      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-gray-700">
          Showing page <span className="font-medium">{currentPage}</span> of{" "}
          <span className="font-medium">{totalPages}</span>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1 || loading}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1e386d] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
              />
            </svg>
          </button>
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1 || loading}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1e386d] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages || totalPages === 0 || loading}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1e386d] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages || totalPages === 0 || loading}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1e386d] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 5l7 7-7 7M5 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuditTable;
