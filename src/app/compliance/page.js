"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // Import useRouter
import { getCurrentUser, ROLES } from '@/lib/auth'; // Import getCurrentUser and ROLES
import Cookies from 'js-cookie'; // Import Cookies

export default function CompliancePage() {
  const router = useRouter(); // Initialize useRouter
  const [totalFlightsLogged, setTotalFlightsLogged] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null); // State for current user

  useEffect(() => {
    const fetchComplianceData = async () => {
      try {
        setLoading(true);
        setError(null);
        const user = await getCurrentUser(); // Await getCurrentUser
        setCurrentUser(user); // Set current user

        const token = Cookies.get('firebase_id_token'); // Get token from cookie

        if (!user || !token) {
          setError("Authentication required. Please log in.");
          setLoading(false);
          router.push('/login'); // Redirect to login if not authenticated
          return;
        }

        // Role-based access control for the page
        if (user.role !== ROLES.ADMIN && user.role !== ROLES.PILOT) {
          router.push('/access-denied'); // Redirect if not an Admin or Pilot
          return;
        }

        const baseUrl = window.location.origin;
        let apiUrl = `${baseUrl}/api/flights`;

        // If user is a Pilot, filter flights by their pilotId
        if (user.role === ROLES.PILOT && user.pilotId) {
          apiUrl = `${baseUrl}/api/flights?pilotId=${user.pilotId}`;
        }

        const response = await fetch(apiUrl, { // Use filtered API URL
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setTotalFlightsLogged(data.data.length); // Access data from the 'data' field
      } catch (err) {
        console.error("Failed to fetch compliance data:", err);
        setError("Failed to load compliance data. Please try again later.");
        setTotalFlightsLogged(0);
      } finally {
        setLoading(false);
      }
    };
    fetchComplianceData();
  }, []);

  // Render loading or error state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-gray-700">Loading compliance data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  // If user is not authorized, they would have been redirected by now.
  // This check is mostly for clarity, though the useEffect handles the redirect.
  if (currentUser && currentUser.role !== ROLES.ADMIN && currentUser.role !== ROLES.PILOT) {
    return null; // Should already be redirected
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-gray-800">CAAZ Compliance Dashboard</h1>
      <p className="text-gray-600">
        Key metrics and reports related to drone operations compliance.
      </p>

      <div className="bg-white p-4 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold text-gray-700">Total Flights Logged {currentUser?.role === ROLES.PILOT ? 'by You' : ''}</h2>
        <p className="text-3xl font-bold text-blue-600">{totalFlightsLogged}</p>
      </div>

      {/* Add more compliance metrics and reports here */}
    </div>
  );
}
