import React, { useState } from "react";
import DatePicker from "react-datepicker";

const RateTable = ({
  rates,
  loading,
  hasMore,
  loadMore,
  onSearch,
  onDateFilter,
  onEdit,
  isArchived,
  showArchiveButton = true,
  showUnarchiveButton = true,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearch(value);
  };

  const handleDateChange = (start, end) => {
    setStartDate(start);
    setEndDate(end);
    onDateFilter(start, end);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setStartDate(null);
    setEndDate(null);
    onSearch("");
    onDateFilter(null, null);
  };

  const EmptyState = () => (
    <div className="bg-gray-50 p-8 text-center rounded-lg">
      <svg
        className="mx-auto h-12 w-12 text-gray-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
      <h3 className="mt-2 text-sm font-medium text-gray-900">
        No {isArchived ? "archived" : "current"} rates found
      </h3>
      <p className="mt-1 text-sm text-gray-500">
        {isArchived
          ? "There are no archived rates matching your criteria."
          : "No current rates are available."}
      </p>
      {searchTerm || startDate || endDate ? (
        <button
          onClick={handleClearFilters}
          className="mt-4 bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1e386d]"
        >
          Clear Filters
        </button>
      ) : !isArchived ? (
        <button
          onClick={() => (window.location.href = "/rates?action=new")}
          className="mt-4 bg-[#1e386d] py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-[#152951] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1e386d]"
        >
          Add New Rate
        </button>
      ) : null}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Filters */}
      {/* Updated flex container for better alignment */}
      <div className="flex flex-col md:flex-row md:items-end gap-4">
        {/* Search Input - Allow it to grow */}
        <div className="flex-grow">
          <label htmlFor="search" className="sr-only">
            Search
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              id="search"
              type="text"
              // Ensure input takes full width within its container
              className="form-input pl-10 w-full"
              placeholder="Search rates, dates, notes, etc."
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
        </div>

        {/* Start Date Picker - Prevent shrinking */}
        <div className="flex-shrink-0">
          <label
            htmlFor="startDate"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Start Date
          </label>
          <DatePicker
            id="startDate"
            selected={startDate}
            onChange={(date) => handleDateChange(date, endDate)}
            selectsStart
            startDate={startDate}
            endDate={endDate}
            // Adjust width for responsiveness
            className="form-input w-full md:w-auto"
            placeholderText="From"
            dateFormat="MMM d, yyyy"
            isClearable
          />
        </div>

        {/* End Date Picker - Prevent shrinking */}
        <div className="flex-shrink-0">
          <label
            htmlFor="endDate"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            End Date
          </label>
          <DatePicker
            id="endDate"
            selected={endDate}
            onChange={(date) => handleDateChange(startDate, date)}
            selectsEnd
            startDate={startDate}
            endDate={endDate}
            minDate={startDate}
            // Adjust width for responsiveness
            className="form-input w-full md:w-auto"
            placeholderText="To"
            dateFormat="MMM d, yyyy"
            isClearable
          />
        </div>

        {/* Clear Button - Prevent shrinking */}
        <div className="flex-shrink-0">
          <button
            onClick={handleClearFilters}
            // Adjust width for responsiveness, ensure consistent height with inputs
            className="bg-[#e6ecf5] text-[#1e386d] px-4 py-2 rounded font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-[#e6ecf5] focus:ring-offset-2 h-10 w-full md:w-auto"
            disabled={!searchTerm && !startDate && !endDate}
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1e386d]"></div>
        </div>
      )}

      {/* Empty state */}
      {!loading && rates.length === 0 && <EmptyState />}

      {/* Table */}
      {!loading && rates.length > 0 && (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Rate (PHP)
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Effective Date
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Last Updated
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Updated By
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Notes
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rates.map((rate) => (
                  <tr key={rate.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ₱{rate.rate.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {rate.effectiveFrom.toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {rate.updatedAt.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {rate.updatedBy}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {rate.notes || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => onEdit(rate)}
                          className="text-[#1e386d] hover:text-[#152951]"
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Load more button */}
          {hasMore && (
            <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
              <button
                onClick={loadMore}
                disabled={loading}
                className="w-full py-2 text-sm text-[#1e386d] hover:text-[#152951] font-medium flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-[#1e386d] mr-2"></div>
                    Loading...
                  </>
                ) : (
                  <>
                    Load More
                    <svg
                      className="ml-1 h-4 w-4"
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
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RateTable;
