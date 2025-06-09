"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // Import useRouter
import { PlusCircle, Upload, Search } from 'lucide-react';
import DataTable from '@/components/ui/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import PilotTableSkeleton from '@/components/ui/PilotTableSkeleton';
import { getCurrentUser, ROLES } from '@/lib/auth'; // Import getCurrentUser and ROLES
import Cookies from 'js-cookie'; // Import Cookies

export default function PilotsPage() {
  const router = useRouter(); // Initialize useRouter
  const [pilots, setPilots] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPilot, setSelectedPilot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUserRole, setCurrentUserRole] = useState(null); // State for user role

  useEffect(() => {
    const fetchPilots = async () => {
      try {
        setLoading(true);
        setError(null);
        const currentUser = await getCurrentUser(); // Await getCurrentUser
        setCurrentUserRole(currentUser?.role); // Set the user role

        const token = Cookies.get('firebase_id_token'); // Get token from cookie

        if (!currentUser || !token) {
          setError("Authentication required. Please log in.");
          setLoading(false);
          router.push('/login'); // Redirect to login if not authenticated
          return;
        }

        // Role-based access control for the page
        if (currentUser.role !== ROLES.ADMIN) {
          router.push('/access-denied'); // Redirect if not an Admin
          return;
        }

        const baseUrl = window.location.origin;
        const response = await fetch(`${baseUrl}/api/pilots`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setPilots(data.data); // Access data from the 'data' field of the success response
      } catch (err) {
        console.error("Failed to fetch pilots:", err);
        setError("Failed to load pilots. Please try again later.");
        setPilots([]); // Clear pilots on error
      } finally {
        setLoading(false);
      }
    };
    fetchPilots();
  }, []);

  const getCertificationStatus = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      const result = { status: 'Expired', color: 'bg-red-100 text-red-800' };
      return result;
    } else if (diffDays <= 30) {
      const result = { status: 'Expiring Soon', color: 'bg-yellow-100 text-yellow-800' };
      return result;
    } else {
      const result = { status: 'Valid', color: 'bg-green-100 text-green-800' };
      return result;
    }
  };

  const columns = [
    { header: 'Pilot Name', accessor: 'name' },
    {
      header: 'Status',
      accessor: 'status',
      cell: ({ row }) => {
        // Defensive: handle missing or undefined status
        const pilotStatus = row?.status ?? 'Unknown';
        return (
          <Badge className={`$${
            pilotStatus === 'Active' ? 'bg-green-500' :
            pilotStatus === 'Inactive' ? 'bg-gray-500' :
            pilotStatus === 'Suspended' ? 'bg-red-500' :
            'bg-blue-500'
          } text-white`}
          >
            {pilotStatus}
          </Badge>
        );
      },
    },
    {
      header: 'Certifications',
      accessor: 'certifications',
      cell: ({ row }) => {
        if (!row) {
          return <span className="text-gray-400">Invalid pilot data</span>;
        }
        const certs = row.certifications ?? [];
        if (certs.length === 0) {
          return <span className="text-gray-400">No certifications</span>;
        }
        return (
          <div className="flex flex-wrap gap-1">
            {certs.map((cert, index) => {
              if (!cert || typeof cert !== 'object') return null;
              // Defensive: check cert.expires exists before calling getCertificationStatus
              let status = 'Unknown', color = 'bg-gray-200 text-gray-600';
              if (cert.expires) {
                const result = getCertificationStatus(cert.expires);
                status = result.status;
                color = result.color;
              }
              return (
                <Badge key={index} className={`${color}`}>
                  {cert.type || 'Unknown'} ({status})
                </Badge>
              );
            })}
          </div>
        );
      },
    },
    { header: 'Contact', accessor: 'contact' },
    {
      header: 'Actions',
      accessor: 'actions',
      cell: ({ row }) => {
        if (!row) {
          return <span className="text-gray-400">N/A</span>; // Or some other placeholder
        }
        const pilotId = row.id ?? 'unknown-id'; // Provide a default ID
        return (
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={() => {
              setSelectedPilot(row);
              setIsModalOpen(true);
            }}>
              View Details
            </Button>
            <a href={`/pilots/${row.id}`} className="text-blue-600 hover:underline text-sm">View Profile</a>
          </div>
        );
      },
    },
  ];

  const filteredPilots = pilots.filter(pilot => {
    const pilotName = pilot.name?.toLowerCase() || '';
    const pilotStatus = pilot.status?.toLowerCase() || '';
    const certificationsMatch = pilot.certifications?.some(cert => cert.type?.toLowerCase().includes(searchTerm.toLowerCase())) || false;

    return pilotName.includes(searchTerm.toLowerCase()) ||
           pilotStatus.includes(searchTerm.toLowerCase()) ||
           certificationsMatch;
  });

  // handleUploadProof function is removed as it's replaced by View Details modal

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-800">Pilot Directory</h1>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
          <PlusCircle size={20} className="mr-2" /> Add New Pilot
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Input
          type="text"
          placeholder="Search pilots by name, status, or certification"
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
      </div>

      {/* Pilot Directory Table */}
      {loading && <PilotTableSkeleton />}
      {error && <p className="text-center text-red-500">{error}</p>}
      {!loading && !error && filteredPilots.length === 0 && (
        <p className="text-center text-gray-500">No pilots found.</p>
      )}
      {!loading && !error && filteredPilots.length > 0 && (
        <DataTable columns={columns} data={filteredPilots} />
      )}

      {/* Pilot Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Pilot Details</DialogTitle>
            <DialogDescription>
              Detailed information for Pilot ID: {selectedPilot?.id}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 items-center gap-4">
              <span className="text-gray-500">Name:</span>
              <span>{selectedPilot?.name ?? 'N/A'}</span>
            </div>
            <div className="grid grid-cols-2 items-center gap-4">
              <span className="text-gray-500">Email:</span>
              <span>{selectedPilot?.email ?? 'N/A'}</span>
            </div>
            <div className="grid grid-cols-2 items-center gap-4">
              <span className="text-gray-500">Contact:</span>
              <span>{selectedPilot?.contact ?? 'N/A'}</span>
            </div>
            <div className="grid grid-cols-2 items-center gap-4">
              <span className="text-gray-500">Status:</span>
              <span>{selectedPilot?.status ?? 'N/A'}</span>
            </div>
            <div className="grid grid-cols-2 items-start gap-4">
              <span className="text-gray-500">Certifications:</span>
              <div>
                {selectedPilot?.certifications && selectedPilot.certifications.length > 0 ? (
                  selectedPilot.certifications.map((cert, index) => (
                    <div key={index} className="mb-1">
                      <Badge className={`${getCertificationStatus(cert.expires || '').color}`}>
                        {cert.type || 'Unknown'} (Expires: {cert.expires || 'N/A'})
                      </Badge>
                    </div>
                  ))
                ) : (
                  <span className="text-gray-400">No certifications</span>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
