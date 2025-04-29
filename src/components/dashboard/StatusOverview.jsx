// src/components/dashboard/StatusOverview.jsx
import React from "react";

const StatusOverview = ({ status }) => {
  return (
    <div className="card h-full">
      <h3 className="text-lg font-semibold text-[#1e386d] mb-4">
        System Status
      </h3>

      <div className="flex items-center mb-4">
        <div
          className={`w-3 h-3 rounded-full mr-2 ${
            status.status === "operational"
              ? "bg-[#28a745]"
              : status.status === "maintenance"
              ? "bg-[#ffc107]"
              : "bg-[#dc3545]"
          }`}
        ></div>
        <span className="font-medium capitalize">
          {status.status === "operational"
            ? "All Systems Operational"
            : status.status === "maintenance"
            ? "Scheduled Maintenance"
            : "System Disruption"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-500">Uptime</p>
          <p className="font-medium">{status.uptime}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Last Maintenance</p>
          <p className="font-medium">{status.lastMaintenance}</p>
        </div>
      </div>
    </div>
  );
};

export default StatusOverview;
