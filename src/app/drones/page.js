// src/app/drones/page.js
"use client";

import React, { useState, useEffect } from 'react';
import DataTable from '@/components/ui/DataTable';
import { PlusCircle, Search } from 'lucide-react';
import DroneTableSkeleton from '@/components/ui/DroneTableSkeleton';
import { getCurrentUser } from '@/lib/auth'; // Import getCurrentUser

export default function DronesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [drones, setDrones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDrones = async () => {
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

        const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || window.location.origin;
        const response = await fetch(`${apiBaseUrl}/api/drones`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Fetched drones data:', data);
        setDrones(data.data); // Access data from the 'data' field
      } catch (err) {
        console.error("Failed to fetch drones:", err);
        setError("Failed to load drones. Please try again later.");
        setDrones([]);
      } finally {
        setLoading(false);
      }
    };
    fetchDrones();
  }, []);

  const columns = [
    { header: 'ID', accessor: 'id' },
    { header: 'Make', accessor: 'make' },
    { header: 'Model', accessor: 'model' },
    { header: 'Serial Number', accessor: 'serial' },
    {
      header: 'Purchase Date',
      accessor: 'purchaseDate',
      cell: ({ row }) => {
        if (!row || !row.purchaseDate) {
          return <span className="text-gray-400">N/A</span>;
        }
        return new Date(row.purchaseDate).toLocaleDateString();
      },
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: ({ row }) => {
        if (!row || !row.status) {
          return <span className="text-gray-400">N/A</span>;
        }
        return (
          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
            row.status === 'Available' ? 'bg-green-100 text-green-800' :
            row.status === 'Maintenance' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}
          >
            {row.status}
          </span>
        );
      },
    },
    {
      header: 'Next Service',
      accessor: 'nextServiceDate',
      cell: ({ row }) => {
        if (!row || !row.nextServiceDate) {
          return <span className="text-gray-400">N/A</span>;
        }
        return new Date(row.nextServiceDate).toLocaleDateString();
      },
    },
    {
      header: 'Actions',
      accessor: 'actions',
      cell: ({ row }) => {
        if (!row || !row.id) {
          return <span className="text-gray-400">N/A</span>;
        }
        return (
          <a href={`/drones/${row.id}`} className="text-blue-600 hover:underline">View Details</a>
        );
      },
    },
  ];

  const filteredDrones = drones.filter(drone =>
    (drone.model?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (drone.serial?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (drone.status?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-800">Drone Inventory Management</h1>
        <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg flex items-center transition-colors">
          <PlusCircle size={20} className="mr-2" /> Add New Drone
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search drones by name or serial number"
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
      </div>

      {/* Drone Inventory Table */}
      {loading && <DroneTableSkeleton />}
      {error && <p className="text-center text-red-500">{error}</p>}
      {!loading && !error && filteredDrones.length === 0 && (
        <p className="text-center text-gray-500">No drones found.</p>
      )}
      {!loading && !error && filteredDrones.length > 0 && (
        <DataTable columns={columns} data={filteredDrones} />
      )}
    </div>
  );
}
