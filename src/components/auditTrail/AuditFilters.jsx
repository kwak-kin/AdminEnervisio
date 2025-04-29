// src/components/auditTrail/AuditFilters.jsx
import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import { db } from "../../services/firebase";
import { collection, query, getDocs, orderBy, limit } from "firebase/firestore";

const AuditFilters = ({ filters, onFilterChange }) => {
  const [users, setUsers] = useState([]);
  const [actionTypes, setActionTypes] = useState([]);
  const [loading, setLoading] = useState(false);

  // Local state to manage filters
  const [localFilters, setLocalFilters] = useState({ ...filters });

  // Fetch users and action types for dropdowns
  useEffect(() => {
    const fetchFilterOptions = async () => {
      setLoading(true);
      try {
        // Fetch users
        const usersRef = collection(db, "users");
        const usersSnapshot = await getDocs(usersRef);
        const usersData = usersSnapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().display_name || doc.data().email || doc.id,
        }));
        setUsers(usersData);

        // Fetch unique action types
        const auditRef = collection(db, "audittrail");
        const auditQuery = query(
          auditRef,
          orderBy("timestamp", "desc"),
          limit(1000)
        );
        const auditSnapshot = await getDocs(auditQuery);

        const actions = new Set();
        auditSnapshot.docs.forEach((doc) => {
          const action = doc.data().action;
          if (action) actions.add(action);
        });

        setActionTypes(Array.from(actions));
      } catch (error) {
        console.error("Error fetching filter options:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFilterOptions();
  }, []);

  // Handle date range changes
  const handleDateChange = (start, end) => {
    setLocalFilters({
      ...localFilters,
      dateRange: { start, end },
    });
  };

  // Handle other filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setLocalFilters({
      ...localFilters,
      [name]: value,
    });
  };

  // Apply filters
  const applyFilters = () => {
    onFilterChange(localFilters);
  };

  // Reset filters
  const resetFilters = () => {
    const resetFilters = {
      dateRange: { start: null, end: null },
      actionType: "",
      userId: "",
      detailsContent: "",
    };
    setLocalFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  return (
    <div className="space-y-4">
      {/* Filters Row: Start Date, End Date, Action Type */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Start Date */}
        <div className="flex flex-col">
          <label className="form-label mb-1">Start Date</label>
          <DatePicker
            selected={localFilters.dateRange.start}
            onChange={(date) =>
              handleDateChange(date, localFilters.dateRange.end)
            }
            selectsStart
            startDate={localFilters.dateRange.start}
            endDate={localFilters.dateRange.end}
            className="form-input w-full"
            placeholderText="From"
            dateFormat="MMM d, yyyy"
            isClearable
          />
        </div>

        {/* End Date */}
        <div className="flex flex-col">
          <label className="form-label mb-1">End Date</label>
          <DatePicker
            selected={localFilters.dateRange.end}
            onChange={(date) =>
              handleDateChange(localFilters.dateRange.start, date)
            }
            selectsEnd
            startDate={localFilters.dateRange.start}
            endDate={localFilters.dateRange.end}
            minDate={localFilters.dateRange.start}
            className="form-input w-full"
            placeholderText="To"
            dateFormat="MMM d, yyyy"
            isClearable
          />
        </div>

        {/* Action Type */}
        <div className="flex flex-col">
          <label htmlFor="actionType" className="form-label mb-1">
            Action Type
          </label>
          <select
            id="actionType"
            name="actionType"
            className="form-input w-full"
            value={localFilters.actionType}
            onChange={handleFilterChange}
          >
            <option value="">All Actions</option>
            {actionTypes.map((action) => (
              <option key={action} value={action}>
                {action.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>

        {/* <div>
          <label htmlFor="userId" className="form-label">
            User
          </label>
          <select
            id="userId"
            name="userId"
            className="form-input"
            value={localFilters.userId}
            onChange={handleFilterChange}
          >
            <option value="">All Users</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </div> */}
      </div>

      {/* Details Content */}
      <div>
        <label htmlFor="detailsContent" className="form-label">
          Details Content
        </label>
        <input
          type="text"
          id="detailsContent"
          name="detailsContent"
          className="form-input"
          placeholder="Search in details..."
          value={localFilters.detailsContent}
          onChange={handleFilterChange}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={resetFilters}
          className="bg-[#e6ecf5] text-[#1e386d] px-4 py-2 rounded font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-[#e6ecf5] focus:ring-offset-2"
          disabled={loading}
        >
          Reset
        </button>
        <button
          type="button"
          onClick={applyFilters}
          className="bg-[#1e386d] text-white px-4 py-2 rounded font-medium hover:bg-[#152951] focus:outline-none focus:ring-2 focus:ring-[#1e386d] focus:ring-offset-2 flex items-center"
          disabled={loading}
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
};

export default AuditFilters;
