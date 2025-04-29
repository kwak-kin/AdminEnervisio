import React from "react";
import { Link } from "react-router-dom";

const CurrentRate = ({ rate }) => {
  if (!rate) {
    return (
      <div className="card h-full">
        <h3 className="text-lg font-semibold text-[#1e386d] mb-4">
          Current Electricity Rate
        </h3>
        <div className="flex flex-col items-center justify-center h-[calc(100%-2rem)]">
          <p className="text-gray-500 mb-2">No rate data available</p>
          <Link
            to="/rates?action=new"
            className="bg-[#1e386d] text-white px-4 py-2 rounded font-medium hover:bg-[#152951] focus:outline-none focus:ring-2 focus:ring-[#1e386d] focus:ring-offset-2 text-sm"
          >
            Add New Rate
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`card h-full ${
        rate.archived ? "border-l-4 border-[#ffc107]" : ""
      }`}
    >
      <h3 className="text-lg font-semibold text-[#1e386d] mb-4">
        {rate.archived ? "Latest Rate (Archived)" : "Current Electricity Rate"}
        {rate.archived && (
          <span className="ml-2 text-xs font-normal text-[#ffc107] bg-yellow-50 px-2 py-1 rounded">
            Archived
          </span>
        )}
      </h3>

      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-500 font-semibold">
            Rates per kWh (by consumption bracket)
          </p>
          <ul className="text-base font-bold space-y-1">
            <li>
              <span className="text-[#1e386d]">₱{rate.rate.toFixed(2)}</span>
              <span className="text-sm text-gray-600 ml-2">(200-399 kWh)</span>
            </li>
            <li>
              <span className="text-[#1e386d]">
                ₱{(rate.kwh_rate2 ?? rate.rate + 0.56).toFixed(2)}
              </span>
              <span className="text-sm text-gray-600 ml-2">(400-799 kWh)</span>
            </li>
            <li>
              <span className="text-[#1e386d]">
                ₱
                {(
                  rate.kwh_rate3 ??
                  (rate.kwh_rate2
                    ? rate.kwh_rate2 + 0.62
                    : rate.rate + 0.56 + 0.62)
                ).toFixed(2)}
              </span>
              <span className="text-sm text-gray-600 ml-2">
                (800 kWh and up)
              </span>
            </li>
          </ul>
        </div>

        <div className="text-sm">
          <p className="text-gray-500">
            Effective from:{" "}
            <span className="text-gray-700">
              {rate.effectiveFrom.toLocaleDateString()}
            </span>
          </p>
          <p className="text-gray-500">
            Last updated:{" "}
            <span className="text-gray-700">
              {rate.updatedAt.toLocaleDateString()}
            </span>
          </p>
          <p className="text-gray-500">
            Updated by: <span className="text-gray-700">{rate.updatedBy}</span>
          </p>
        </div>

        {rate.archived ? (
          <div className="mt-2">
            <Link
              to="/rates?action=new"
              className="text-sm font-medium text-[#1e386d] hover:text-[#152951]"
            >
              Add new active rate
            </Link>
          </div>
        ) : (
          <div className="mt-2">
            <Link
              to={`/rates`}
              className="text-sm font-medium text-[#1e386d] hover:text-[#152951]"
            >
              Manage rates
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default CurrentRate;
