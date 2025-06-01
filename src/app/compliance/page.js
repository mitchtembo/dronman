"use client";

import React, { useState, useEffect } from 'react';
import { getCurrentUser } from '@/lib/auth'; // Import getCurrentUser

export default function CompliancePage() {
  const [totalFlightsLogged, setTotalFlightsLogged] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchComplianceData = async () => {
      try {
        setLoading(true);
        setError(null);
        const currentUser = getCurrentUser();
        const token = currentUser?.token;

        if (!token) {
          setError("Authentication required. Please log in.");
          setLoading(false);
          return;
        }

        const baseUrl = window.location.origin;
        const response = await fetch(`${baseUrl}/api/flights`, { // Assuming /api/flights provides all logs
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

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-gray-800">CAAZ Compliance Dashboard</h1>
      <p className="text-gray-600">
        CAAZ Compliance Dashboard - Key metrics and reports will be displayed here.
      </p>

      <div className="bg-white p-4 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold text-gray-700">Total Flights Logged</h2>
        <p className="text-3xl font-bold text-blue-600">{totalFlightsLogged}</p>
      </div>

      {/* Add more compliance metrics and reports here */}
    </div>
  );
}
