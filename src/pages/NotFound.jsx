// src/pages/NotFound.jsx
import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const NotFound = () => {
  const { currentUser } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-9xl font-bold text-[#1e386d]">404</h1>
        <h2 className="text-2xl font-semibold text-gray-900 mt-4">
          Page Not Found
        </h2>
        <p className="mt-2 text-gray-600">
          The page you're looking for doesn't exist or you don't have permission
          to view it.
        </p>
        <div className="mt-6">
          <Link
            to={currentUser ? "/dashboard" : "/login"}
            className="btn-primary inline-flex items-center"
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
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            {currentUser ? "Back to Dashboard" : "Go to Login"}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
