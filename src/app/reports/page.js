// src/app/reports/page.js
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, ROLES } from '@/lib/auth';
import Cookies from 'js-cookie';
import StatCard from '@/components/ui/StatCard';
import BarChart from '@/components/charts/BarChart';
import LineChart from '@/components/charts/LineChart';

export default function ReportsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState({
    totalPilots: 0,
    totalMissions: 0,
    totalFlightHours: "0.0 hours",
    missionsByStatusData: [],
    topPilotsByHoursData: [],
    monthlyFlightHoursData: [],
  });

  useEffect(() => {
    const checkAccessAndFetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const user = await getCurrentUser();
        setCurrentUser(user);

        const token = Cookies.get('firebase_id_token');

        if (!user || !token) {
          setError("Authentication required. Please log in.");
          router.push('/login');
          setLoading(false); // Ensure loading is set to false before early return
          return;
        }

        if (user.role !== ROLES.ADMIN) {
          setError("Access Denied. You do not have permission to view this page.");
          router.push('/access-denied');
          setLoading(false); // Ensure loading is set to false before early return
          return;
        }

        const headers = { 'Authorization': `Bearer ${token}` };
        const [pilotsRes, missionsRes, flightsRes] = await Promise.all([
          fetch('/api/pilots', { headers }),
          fetch('/api/missions', { headers }),
          fetch('/api/flights', { headers })
        ]);

        if (!pilotsRes.ok) throw new Error(`Failed to fetch pilots: ${pilotsRes.status} ${pilotsRes.statusText}`);
        if (!missionsRes.ok) throw new Error(`Failed to fetch missions: ${missionsRes.status} ${missionsRes.statusText}`);
        if (!flightsRes.ok) throw new Error(`Failed to fetch flights: ${flightsRes.status} ${flightsRes.statusText}`);

        const pilotsJson = await pilotsRes.json();
        const missionsJson = await missionsRes.json();
        const flightsJson = await flightsRes.json();

        const pilots = pilotsJson.data || [];
        const missions = missionsJson.data || [];
        const flightLogs = flightsJson.data || [];

        // Process data
        const totalPilots = pilots.length;
        const totalMissions = missions.length;

        let totalMinutes = 0;
        flightLogs.forEach(log => {
          totalMinutes += log.duration || 0;
        });
        const totalFlightHoursNum = totalMinutes / 60;

        const missionsByStatus = missions.reduce((acc, mission) => {
          const status = mission.status || 'Unknown';
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {});
        const missionsByStatusData = Object.entries(missionsByStatus).map(([name, value]) => ({ name, value }));

        const pilotHoursMap = flightLogs.reduce((acc, log) => {
          if(log.pilotId) { // Ensure pilotId exists
            acc[log.pilotId] = (acc[log.pilotId] || 0) + (log.duration || 0);
          }
          return acc;
        }, {});

        const pilotNameMap = pilots.reduce((map, pilot) => {
          if(pilot.id && pilot.name) { // Ensure pilot id and name exist
             map[pilot.id] = pilot.name;
          }
          return map;
        }, {});

        const topPilotsByHoursData = Object.entries(pilotHoursMap)
          .map(([pilotId, minutes]) => ({
            name: pilotNameMap[pilotId] || `Pilot ID: ${pilotId.substring(0,6)}...`,
            value: parseFloat((minutes / 60).toFixed(1))
          }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 5);

        const monthlyFlightHoursMap = flightLogs.reduce((acc, log) => {
          if (log.date && (log.duration || 0) > 0) { // Ensure date and duration exist
            try {
              const date = new Date(log.date);
              // Format like "Jan 2024". Using 'en-US' locale for month name consistency.
              const monthYear = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
              acc[monthYear] = (acc[monthYear] || 0) + (log.duration || 0);
            } catch (e) {
              console.warn("Invalid date for flight log:", log.date, e);
            }
          }
          return acc;
        }, {});

        const monthlyFlightHoursData = Object.entries(monthlyFlightHoursMap)
          .map(([monthYear, minutes]) => ({
            name: monthYear,
            value: parseFloat((minutes / 60).toFixed(1))
          }))
          // Custom sort for "Mon YYYY" strings
          .sort((a, b) => {
            const dateA = new Date(a.name);
            const dateB = new Date(b.name);
            return dateA - dateB;
          });

        setReportData({
          totalPilots,
          totalMissions,
          totalFlightHours: `${totalFlightHoursNum.toFixed(1)} hours`,
          missionsByStatusData,
          topPilotsByHoursData,
          monthlyFlightHoursData
        });

      } catch (err) {
        console.error("Failed to load report data:", err);
        setError(err.message || "Failed to load report data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    checkAccessAndFetchData();
  }, [router]); // router is a dependency because router.push is used

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-gray-700 text-xl">Loading Reports...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-center p-4">
        <p className="text-red-600 text-xl mb-4">Error Loading Reports</p>
        <p className="text-gray-700">{error}</p>
        <button
          onClick={() => router.push('/dashboard')}
          className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  if (!currentUser || currentUser.role !== ROLES.ADMIN) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <p className="text-gray-700 text-xl">Access Denied. Redirecting...</p>
        </div>
      );
  }

  return (
    <div className="space-y-8 p-4 md:p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-semibold text-gray-800 mb-6">Reports Overview</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard title="Total Pilots" value={String(reportData.totalPilots)} />
        <StatCard title="Total Missions" value={String(reportData.totalMissions)} />
        <StatCard title="Total Flight Hours" value={reportData.totalFlightHours} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Missions by Status</h2>
          {reportData.missionsByStatusData && reportData.missionsByStatusData.length > 0 ? (
            <BarChart data={reportData.missionsByStatusData} />
          ) : (
            <p className="text-gray-500 text-center py-10">No mission data to display.</p>
          )}
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Top 5 Pilots by Flight Hours</h2>
          {reportData.topPilotsByHoursData && reportData.topPilotsByHoursData.length > 0 ? (
            <BarChart data={reportData.topPilotsByHoursData} />
          ) : (
            <p className="text-gray-500 text-center py-10">No pilot flight hour data to display.</p>
          )}
        </div>
      </div>

      <div className="mt-6 bg-white p-6 rounded-xl shadow-lg">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Monthly Flight Hours</h2>
        {reportData.monthlyFlightHoursData && reportData.monthlyFlightHoursData.length > 0 ? (
          <LineChart data={reportData.monthlyFlightHoursData} />
        ) : (
          <p className="text-gray-500 text-center py-10">No monthly flight hour data to display.</p>
        )}
      </div>
    </div>
  );
}
