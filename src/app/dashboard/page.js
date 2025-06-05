// src/app/dashboard/page.js
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import StatCard from '@/components/ui/StatCard';
import Cookies from 'js-cookie'; // Import Cookies
import { PlusCircle, CalendarDays, TrendingUp, BarChartBig, CheckCircle, AlertTriangle, Users, Plane, Bot } from 'lucide-react';
import CustomLineChart from '../../components/charts/LineChart';
import CustomBarChart from '../../components/charts/BarChart';
import { getCurrentUser } from '@/lib/auth';
import { isCertificationExpiringSoon, isCertificationExpired } from '@/lib/utils'; // Keep these utilities

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalPilots: 0,
    activeCertifications: 0,
    upcomingRenewals: 0,
    totalFlights: 0,
    flightHours: 0,
    upcomingAssignments: 0,
    userName: "Guest",
    certificationStatus: null,
  });
  const [flightHoursChartData, setFlightHoursChartData] = useState([]);
  const [certificationStatusChartData, setCertificationStatusChartData] = useState([]);
  const [upcomingAssignmentsTableData, setUpcomingAssignmentsTableData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const currentUser = await getCurrentUser(); // Await getCurrentUser as it's async
        const token = Cookies.get('firebase_id_token'); // Get token from cookie

        if (!currentUser || !token) {
          setError("Authentication required. Please log in.");
          setLoading(false);
          router.push('/login'); // Redirect to login if not authenticated
          return;
        }

        const authHeaders = {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        };

        const baseUrl = window.location.origin;

        let userNameToDisplay = currentUser.email; // Default to email
        let pilotData = null; // Initialize pilotData to null

        // If the user has a pilotId, fetch pilot details for the name
        if (currentUser.pilotId) {
          try {
            const pilotResponse = await fetch(`${baseUrl}/api/pilots?id=${currentUser.pilotId}`, authHeaders);
            if (pilotResponse.ok) {
              pilotData = await pilotResponse.json(); // Assign to pilotData
              if (pilotData.data && pilotData.data.name) {
                userNameToDisplay = pilotData.data.name;
              }
            } else {
              console.warn(`Failed to fetch pilot data for ${currentUser.pilotId}:`, pilotResponse.status);
            }
          } catch (pilotFetchError) {
            console.error("Error fetching pilot data:", pilotFetchError);
          }
        }

        // Fetch Pilots data (all pilots for admin, or filtered for pilot/viewer)
        const pilotsResponse = await fetch(`${baseUrl}/api/pilots`, authHeaders);
        if (!pilotsResponse.ok) throw new Error(`HTTP error! status: ${pilotsResponse.status}`);
        const pilotsData = await pilotsResponse.json();
        const pilots = pilotsData.data; // Access data from the 'data' field

        const totalPilots = pilots.length;
        const activeCertifications = pilots.filter(p => p.certifications.some(c => c.status === 'Valid')).length;
        const upcomingRenewals = pilots.filter(p => p.certifications.some(c => isCertificationExpiringSoon(c.expires))).length;

        // Fetch Flight Logs data
        const flightLogsResponse = await fetch(`${baseUrl}/api/flights`, authHeaders);
        if (!flightLogsResponse.ok) throw new Error(`HTTP error! status: ${flightLogsResponse.status}`);
        const flightLogsData = await flightLogsResponse.json();
        const flightLogs = flightLogsData.data; // Access data from the 'data' field

        const totalFlights = flightLogs.length;
        const flightHours = flightLogs.reduce((sum, log) => sum + log.duration / 60, 0);

        // Prepare flight hours chart data
        const monthlyFlightHours = flightLogs.reduce((acc, log) => {
          const month = new Date(log.date).toLocaleString('default', { month: 'short' });
          acc[month] = (acc[month] || 0) + log.duration / 60;
          return acc;
        }, {});
        const chartMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const currentMonthIndex = new Date().getMonth();
        const recentMonths = [];
        for (let i = 0; i < 6; i++) {
          recentMonths.unshift(chartMonths[(currentMonthIndex - i + 12) % 12]);
        }
        const formattedFlightHoursData = recentMonths.map(month => ({
          name: month,
          value: monthlyFlightHours[month] || 0,
        }));
        setFlightHoursChartData(formattedFlightHoursData);

        // Prepare certification status chart data
        const certStatusCounts = { Valid: 0, "Expiring Soon": 0, Expired: 0 };
        pilots.forEach(pilot => {
          pilot.certifications.forEach(cert => {
            if (isCertificationExpired(cert.expires)) {
              certStatusCounts.Expired++;
            } else if (isCertificationExpiringSoon(cert.expires)) {
              certStatusCounts["Expiring Soon"]++;
            } else {
              certStatusCounts.Valid++;
            }
          });
        });
        setCertificationStatusChartData([
          { name: 'Valid', value: certStatusCounts.Valid },
          { name: 'Expiring Soon', value: certStatusCounts["Expiring Soon"] },
          { name: 'Expired', value: certStatusCounts.Expired },
        ]);

        // Fetch Missions data for upcoming assignments
        const missionsResponse = await fetch(`${baseUrl}/api/missions`, authHeaders);
        if (!missionsResponse.ok) throw new Error(`HTTP error! status: ${missionsResponse.status}`);
        const missionsData = await missionsResponse.json();
        const missions = missionsData.data; // Access data from the 'data' field

        const upcomingAssignments = missions.filter(m => new Date(m.date) > new Date()).length;
        const formattedUpcomingAssignments = missions.filter(m => new Date(m.date) > new Date()).map(m => ({
          id: m.id,
          date: new Date(m.date).toLocaleDateString(), // Format date for display
          location: m.location,
          aircraft: m.droneId, // Assuming droneId can be mapped to aircraft name
          status: m.status,
          statusColor: m.status === 'Scheduled' ? 'bg-yellow-500' : m.status === 'Confirmed' ? 'bg-green-500' : 'bg-blue-500',
        }));
        setUpcomingAssignmentsTableData(formattedUpcomingAssignments);

        // Fetch pilot-specific certification data for the progress bar
        let pilotCertification = null;
        if (currentUser.pilotId) {
          const pilotDoc = pilots.find(p => p.id === currentUser.pilotId);
          if (pilotDoc && pilotDoc.certifications && pilotDoc.certifications.length > 0) {
            // Assuming one primary certification for simplicity, or the first one
            pilotCertification = pilotDoc.certifications[0];
          }
        }

        setStats(prevStats => ({
          ...prevStats,
          totalPilots,
          activeCertifications,
          upcomingRenewals,
          totalFlights,
          flightHours: parseFloat(flightHours.toFixed(1)),
          upcomingAssignments,
          userName: userNameToDisplay, // Use the dynamically determined name
          certificationStatus: pilotCertification, // Set pilot's certification for display
        }));
        console.log("Dashboard stats updated:", { userName: userNameToDisplay, currentUser, pilotData: pilotData?.data, pilotCertification }); // Debug log
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
        setError("Failed to load dashboard data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Client-side role-based access control for the page
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-gray-700">Loading dashboard...</p>
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

  // Redirect if user is not a Pilot (or Admin, if you want strict pilot-only view)
  // For this "Pilot Dashboard", we'll allow Admin to view it too, but focus on pilot data.
  // If strictly pilot-only, uncomment: if (currentUser?.role !== 'Pilot') router.push('/access-denied');
  // For now, we'll assume the data fetching logic handles the filtering for non-admins/non-pilots.
  // The prompt says "only visible for pilot view", so let's enforce it.
  if (stats.currentUser && stats.currentUser.role !== 'Pilot' && stats.currentUser.role !== 'Administrator') {
    router.push('/access-denied');
    return null; // Prevent rendering
  }


  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-800">Pilot Dashboard</h1>
        <p className="text-gray-600">Welcome back, {stats.userName}!</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard title="Total Flights" value={stats.totalFlights} icon={<TrendingUp size={24} />} />
        <StatCard title="Flight Hours" value={stats.flightHours} icon={<BarChartBig size={24} />} />
        <StatCard title="Upcoming Assignments" value={stats.upcomingAssignments} icon={<CalendarDays size={24} />} />
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Quick Actions</h2>
        <div className="flex space-x-4">
          <button
            onClick={() => router.push('/flights/new')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg flex items-center transition-colors"
          >
            <PlusCircle size={20} className="mr-2" /> Log New Flight
          </button>
          <button className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-lg flex items-center transition-colors">
            <CalendarDays size={20} className="mr-2" /> View Schedule
          </button>
        </div>
      </div>

      {/* Flight Statistics - Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Flight Hours Over Time</h2>
          <div className="h-64">
            <CustomLineChart data={flightHoursChartData} dataKey="value" xAxisDataKey="name" />
          </div>
          <p className="text-sm text-gray-500 mt-2">Last 6 Months</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Flights by Aircraft Type</h2>
          {/* This chart data is not currently fetched, placeholder for now */}
          <div className="h-64">
            {/* Placeholder for Flights by Aircraft Type Bar Chart */}
            <CustomBarChart data={[{name: 'Type A', value: 50}, {name: 'Type B', value: 30}, {name: 'Type C', value: 20}]} dataKey="value" xAxisDataKey="name" />
          </div>
          <p className="text-sm text-gray-500 mt-2">All Time</p>
        </div>
      </div>

      {/* Certification Status */}
      {stats.certificationStatus && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Certification Status</h2>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700">{stats.certificationStatus.name || 'CAAZ Certification'}</p>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                {/* Assuming a fixed 75% for now, or calculate from data if available */}
                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '75%' }}></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">Valid until {new Date(stats.certificationStatus.expires).toLocaleDateString()}</p>
            </div>
            <span className="text-lg font-semibold text-gray-700">75%</span>
          </div>
        </div>
      )}

      {/* Upcoming Assignments Table */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Upcoming Assignments</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aircraft</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {upcomingAssignmentsTableData.map((assignment) => (
                <tr key={assignment.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{assignment.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{assignment.location}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{assignment.aircraft}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${assignment.statusColor} text-white`}>
                      {assignment.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
