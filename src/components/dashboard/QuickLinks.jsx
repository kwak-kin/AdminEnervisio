// src/components/dashboard/QuickLinks.jsx
import React from "react";
import { Link } from "react-router-dom";

const QuickLinks = ({ links }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {links.map((link, index) => (
        <Link
          key={index}
          to={link.link}
          className="card flex flex-col hover:shadow-lg transition-shadow duration-200"
        >
          <div className="flex items-start mb-4">
            <div className="flex-shrink-0">{link.icon}</div>
            <div className="ml-3">
              <h4 className="text-lg font-medium text-[#1e386d]">
                {link.title}
              </h4>
              <p className="text-sm text-gray-500">{link.description}</p>
            </div>
          </div>
          <div className="mt-auto pt-2 text-sm font-medium text-[#1e386d] flex items-center">
            Go to {link.title.toLowerCase()}
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
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </Link>
      ))}
    </div>
  );
};

export default QuickLinks;
