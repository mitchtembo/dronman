"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DataTable from '@/components/ui/DataTable';
import { Search, Map, PlusCircle } from 'lucide-react'; // Import PlusCircle
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { getCurrentUser, ROLES } from '@/lib/auth';
import Cookies from 'js-cookie';

export default function MissionsPage() {
  const router = useRouter();
  const [missions, setMissions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const fetchMissions = async () => {
      try {
        setLoading(true);
        setError(null);
        const user = await getCurrentUser();
        setCurrentUser(user);

        const token = Cookies.get('firebase_id_token');

        if (!user || !token) {
          setError("Authentication required. Please log in.");
          setLoading(false);
          router.push('/login');
          return;
        }

        // Role-based access control for the page
        // Only Admin and Pilot roles should access this page
        if (user.role !== ROLES.ADMIN && user.role !== ROLES.PILOT) {
          router.push('/access-denied');
          return;
        }

        const baseUrl = window.location.origin;
        const response = await fetch(`${baseUrl}/api/missions`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Fetched missions data:', data);
        setMissions(data.data);
      } catch (err) {
        console.error("Failed to fetch missions:", err);
        setError("Failed to load missions. Please try again later.");
        setMissions([]);
      } finally {
        setLoading(false);
      }
    };
    fetchMissions();
  }, []);

  const columns = [
    { header: 'Mission Name', accessor: 'name' },
    { header: 'Client', accessor: 'client' },
    { header: 'Location', accessor: 'location' },
    {
      header: 'Date',
      accessor: 'date',
      cell: ({ row }) => {
        if (!row || !row.date) return 'N/A';
        return new Date(row.date).toLocaleDateString();
      },
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: ({ row }) => {
        const status = row?.status ?? 'Unknown';
        let colorClass = 'bg-gray-100 text-gray-800';
        if (status === 'Scheduled') colorClass = 'bg-yellow-100 text-yellow-800';
        if (status === 'Completed') colorClass = 'bg-green-100 text-green-800';
        if (status === 'In Progress') colorClass = 'bg-blue-100 text-blue-800';
        if (status === 'Cancelled') colorClass = 'bg-red-100 text-red-800';
        return (
          <Badge className={`${colorClass}`}>
            {status}
          </Badge>
        );
      },
    },
    {
      header: 'Assigned Pilot',
      accessor: 'pilotId', // This will be the pilot ID, might need to fetch pilot name
      cell: ({ row }) => {
        // In a real app, you'd fetch pilot name based on pilotId
        // For now, display the ID or a placeholder
        return row?.pilotId || 'N/A';
      },
    },
    {
      header: 'Assigned Drone',
      accessor: 'droneId', // This will be the drone ID, might need to fetch drone model
      cell: ({ row }) => {
        // In a real app, you'd fetch drone model based on droneId
        // For now, display the ID or a placeholder
        return row?.droneId || 'N/A';
      },
    },
  ];

  const filteredMissions = missions.filter(mission =>
    (mission.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (mission.client?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (mission.location?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (mission.status?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-800">Mission Schedule</h1>
        {currentUser?.role === ROLES.ADMIN && ( // Only Admin can add new missions
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg flex items-center transition-colors">
            <PlusCircle size={20} className="mr-2" /> Add New Mission
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Input
          type="text"
          placeholder="Search missions by name, client, location, or status"
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
      </div>

      {/* Missions Table */}
      {loading && <p className="text-center text-gray-500">Loading missions...</p>}
      {error && <p className="text-center text-red-500">{error}</p>}
      {!loading && !error && filteredMissions.length === 0 && (
        <p className="text-center text-gray-500">No missions found.</p>
      )}
      {!loading && !error && filteredMissions.length > 0 && (
        <DataTable columns={columns} data={filteredMissions} />
      )}
    </div>
  );
}
