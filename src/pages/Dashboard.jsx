import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
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
} from "firebase/firestore";
import StatusOverview from "../components/dashboard/StatusOverview";
import UserStats from "../components/dashboard/UserStats";
import CurrentRate from "../components/dashboard/CurrentRate";
import RecentActivity from "../components/dashboard/RecentActivity";
import QuickLinks from "../components/dashboard/QuickLinks";

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState({ total: 0, active: 0 });
  const [currentRate, setCurrentRate] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [systemStatus, setSystemStatus] = useState({
    status: "operational",
    uptime: "99.98%",
    lastMaintenance: new Date(
      Date.now() - 7 * 24 * 60 * 60 * 1000
    ).toLocaleDateString(),
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch user statistics
        const usersRef = collection(db, "users");
        const usersSnapshot = await getDocs(usersRef);
        const totalUsers = usersSnapshot.size;

        // Active users (logged in within the last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const activeUserQuery = query(
          usersRef,
          where("last_login", ">=", sevenDaysAgo)
        );
        const activeUsersSnapshot = await getDocs(activeUserQuery);
        const activeUsers = activeUsersSnapshot.size;

        setUserStats({
          total: totalUsers,
          active: activeUsers,
        });

        // Fetch current electricity rate (explicitly non-archived)
        const ratesRef = collection(db, "meralcorate");
        const currentRateQuery = query(
          ratesRef,
          where("archived", "==", false),
          orderBy("effective_from", "desc"),
          limit(1)
        );

        const currentRateSnapshot = await getDocs(currentRateQuery);

        if (!currentRateSnapshot.empty) {
          // We found a current (non-archived) rate
          const rateData = currentRateSnapshot.docs[0].data();
          const currentRateObj = await processRateDoc(
            currentRateSnapshot.docs[0]
          );
          setCurrentRate(currentRateObj);
        } else {
          // If no non-archived rate exists, check for any rate at all
          const anyRateQuery = query(
            ratesRef,
            orderBy("effective_from", "desc"),
            limit(1)
          );

          const anyRateSnapshot = await getDocs(anyRateQuery);

          if (!anyRateSnapshot.empty) {
            // Use the most recent rate even if archived
            const rateObj = await processRateDoc(anyRateSnapshot.docs[0]);
            setCurrentRate(rateObj);
          } else {
            // No rates at all
            setCurrentRate(null);
          }
        }

        // Fetch recent activities (audit trail)
        const auditRef = collection(db, "audittrail");
        const auditQuery = query(
          auditRef,
          orderBy("timestamp", "desc"),
          limit(5)
        );
        const auditSnapshot = await getDocs(auditQuery);

        const activities = [];
        for (const doc of auditSnapshot.docs) {
          const data = doc.data();
          let userName = "User";

          try {
            const userDoc = await getDoc(doc(db, "users", data.uid));
            if (userDoc.exists()) {
              userName = userDoc.data().display_name || "User";
            }
          } catch (error) {
            console.error("Error fetching user:", error);
          }

          activities.push({
            id: doc.id,
            action: data.action,
            timestamp: data.timestamp?.toDate() || new Date(),
            user: userName,
            details: data.details,
          });
        }

        setRecentActivities(activities);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    // Helper function to process a rate document
    const processRateDoc = async (doc) => {
      const data = doc.data();
      const updatedBy = data.updated_by;

      // Get user who updated the rate
      let updatedByName = "Admin";
      try {
        const userDoc = await getDoc(doc(db, "users", updatedBy));
        if (userDoc.exists()) {
          updatedByName = userDoc.data().display_name || "Admin";
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      }

      return {
        id: doc.id,
        rate: data.kwh_rate,
        effectiveFrom: data.effective_from?.toDate() || new Date(),
        updatedAt: data.updated_datetime?.toDate() || new Date(),
        updatedBy: updatedByName,
        archived: data.archived || false,
        notes: data.notes || "",
      };
    };

    fetchDashboardData();
  }, []);

  const quickLinks = [
    {
      title: "Add Rate",
      description: "Create new Meralco rate",
      icon: (
        <svg
          className="h-8 w-8 text-[#1e386d]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 4v16m8-8H4"
          />
        </svg>
      ),
      link: "/rates?action=new",
    },
    {
      title: "Export Report",
      description: "Generate monthly report",
      icon: (
        <svg
          className="h-8 w-8 text-[#1e386d]"
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
      ),
      link: "/reports?action=export",
    },
    {
      title: "View Audit Log",
      description: "Check system activity",
      icon: (
        <svg
          className="h-8 w-8 text-[#1e386d]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
      ),
      link: "/audit",
    },
    {
      title: "User Analytics",
      description: "View usage patterns",
      icon: (
        <svg
          className="h-8 w-8 text-[#1e386d]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ),
      link: "/reports",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1e386d]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1e386d]">Dashboard</h1>
        <p className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleString()}
        </p>
      </div>

      {/* Status and Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-2">
          <StatusOverview status={systemStatus} />
        </div>
        <div>
          <UserStats stats={userStats} />
        </div>
        <div>
          <CurrentRate rate={currentRate} />
        </div>
      </div>

      {/* Quick Links */}
      <div>
        <h2 className="text-xl font-semibold text-[#1e386d] mb-4">
          Quick Actions
        </h2>
        <QuickLinks links={quickLinks} />
      </div>

      {/* Recent Activity */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-[#1e386d]">
            Recent Activity
          </h2>
          <Link
            to="/audit"
            className="text-sm font-medium text-[#1e386d] hover:text-[#152951]"
          >
            View All
          </Link>
        </div>
        <RecentActivity activities={recentActivities} />
      </div>
    </div>
  );
};

export default Dashboard;
