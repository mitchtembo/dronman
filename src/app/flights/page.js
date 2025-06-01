"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PlusCircle, Download } from 'lucide-react';
import DataTable from '@/components/ui/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import FlightTableSkeleton from '@/components/ui/FlightTableSkeleton';
import { calculateTotalFlightHours } from '@/lib/flightCalculations';
import { getCurrentUser } from '@/lib/auth'; // Import getCurrentUser
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";

export default function FlightHistoryPage() {
  const router = useRouter();
  const [flightLogs, setFlightLogs] = useState([]);
  const [drones, setDrones] = useState([]); // State to store fetched drones
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [totalFlightHours, setTotalFlightHours] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFlightLog, setSelectedFlightLog] = useState(null);

  useEffect(() => {
    const fetchFlightData = async () => {
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

        // Fetch Flight Logs
        const baseUrl = window.location.origin;
        const flightsResponse = await fetch(`${baseUrl}/api/flights`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!flightsResponse.ok) throw new Error(`HTTP error! status: ${flightsResponse.status}`);
        const flightsData = await flightsResponse.json();
        setFlightLogs(flightsData.data);
        console.log('Fetched flight logs data:', flightsData.data);

        // Fetch Drones for display
        const dronesResponse = await fetch(`${baseUrl}/api/drones`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!dronesResponse.ok) throw new Error(`HTTP error! status: ${dronesResponse.status}`);
        const dronesData = await dronesResponse.json();
        setDrones(dronesData.data);
        console.log('Fetched drones data for flights page:', dronesData.data);

        const hours = calculateTotalFlightHours(flightsData.data);
        setTotalFlightHours(hours);

      } catch (err) {
        console.error("Failed to fetch flight data:", err);
        setError("Failed to load flight data. Please try again later.");
        setFlightLogs([]);
        setDrones([]);
      } finally {
        setLoading(false);
      }
    };
    fetchFlightData();
  }, []);

  const columns = [
    {
      accessorKey: 'date',
      header: 'Date',
      cell: ({ row }) => {
        if (!row || !row.date) {
          return <span className="text-gray-400">N/A</span>;
        }
        return new Date(row.date).toLocaleDateString();
      },
    },
    {
      accessorKey: 'droneId',
      header: 'Drone',
      cell: ({ row }) => {
        if (!row || !row.droneId) {
          return <span className="text-gray-400">N/A</span>;
        }
        // Find drone details from the fetched drones state
        const drone = drones.find(d => d.id === row.droneId);
        return drone ? `${drone.model} (${drone.serial})` : row.droneId;
      },
    },
    {
      accessorKey: 'missionType',
      header: 'Mission Type',
      cell: ({ row }) => {
        if (!row || !row.missionType) {
          return <span className="text-gray-400">N/A</span>;
        }
        return row.missionType;
      },
    },
    {
      header: 'Actions',
      accessor: 'actions',
      cell: ({ row }) => (
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={() => {
            setSelectedFlightLog(row);
            setIsModalOpen(true);
          }}>
            View Details
          </Button>
        </div>
      ),
    },
  ];

  const filteredLogs = flightLogs.filter(log => {
    const matchesSearch = searchTerm === '' ||
      Object.values(log).some(value =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      );
    // Example: filter by mission type or drone status
    const matchesFilter = filterStatus === 'all' || log.missionType === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleExport = (format) => {
    alert(`Exporting to ${format}... (Mock functionality)`);
    // Implement actual export logic here (e.g., using jspdf or xlsx)
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-800">Flight History</h1>
        <Button onClick={() => router.push('/flights/new')} className="bg-blue-600 hover:bg-blue-700 text-white">
          <PlusCircle size={20} className="mr-2" /> Log New Flight
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-700">Total Flight Hours</h2>
          <p className="text-3xl font-bold text-blue-600">{totalFlightHours} hrs</p>
        </div>
        {/* Add more summary cards if needed */}
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex flex-col md:flex-row justify-between items-center mb-4 space-y-4 md:space-y-0 md:space-x-4">
          <Input
            placeholder="Search flights..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => setFilterStatus('all')} className={filterStatus === 'all' ? 'bg-gray-200' : ''}>All</Button>
            <Button variant="outline" onClick={() => setFilterStatus('Training')} className={filterStatus === 'Training' ? 'bg-gray-200' : ''}>Training</Button>
            <Button variant="outline" onClick={() => setFilterStatus('Commercial')} className={filterStatus === 'Commercial' ? 'bg-gray-200' : ''}>Commercial</Button>
            {/* Add more filter buttons as needed */}
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => handleExport('PDF')}>
              <Download size={16} className="mr-2" /> Export PDF
            </Button>
            <Button variant="outline" onClick={() => handleExport('Excel')}>
              <Download size={16} className="mr-2" /> Export Excel
            </Button>
          </div>
        </div>
        {loading && <FlightTableSkeleton />}
        {error && <p className="text-center text-red-500">{error}</p>}
        {!loading && !error && filteredLogs.length === 0 && (
          <p className="text-center text-gray-500">No flight logs found.</p>
        )}
        {!loading && !error && filteredLogs.length > 0 && (
          <DataTable columns={columns} data={filteredLogs} />
        )}
      </div>

      {/* Flight Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Flight Log Details</DialogTitle>
            <DialogDescription>
              Detailed information for Flight Log ID: {selectedFlightLog?.id}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 items-center gap-4">
              <span className="text-gray-500">Date:</span>
              <span>{selectedFlightLog?.date ? new Date(selectedFlightLog.date).toLocaleDateString() : 'N/A'}</span>
            </div>
            <div className="grid grid-cols-2 items-center gap-4">
              <span className="text-gray-500">Duration:</span>
              <span>{selectedFlightLog?.duration ?? 'N/A'} min</span>
            </div>
            <div className="grid grid-cols-2 items-center gap-4">
              <span className="text-gray-500">Drone:</span>
              <span>
                {selectedFlightLog?.droneId ? 
                  (mockDrones.find(d => d.id === selectedFlightLog.droneId)?.model || selectedFlightLog.droneId) : 
                  'N/A'}
              </span>
            </div>
            <div className="grid grid-cols-2 items-center gap-4">
              <span className="text-gray-500">Mission Type:</span>
              <span>{selectedFlightLog?.missionType ?? 'N/A'}</span>
            </div>
            <div className="grid grid-cols-2 items-center gap-4">
              <span className="text-gray-500">Location:</span>
              <span>{selectedFlightLog?.location ?? 'N/A'}</span>
            </div>
            <div className="grid grid-cols-2 items-center gap-4">
              <span className="text-gray-500">Weather:</span>
              <span>{selectedFlightLog?.weather ?? 'N/A'}</span>
            </div>
            <div className="grid grid-cols-2 items-center gap-4">
              <span className="text-gray-500">Incidents:</span>
              <span>{selectedFlightLog?.incidents ?? 'None'}</span>
            </div>
            <div className="grid grid-cols-2 items-center gap-4">
              <span className="text-gray-500">Notes:</span>
              <span>{selectedFlightLog?.notes ?? 'None'}</span>
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
