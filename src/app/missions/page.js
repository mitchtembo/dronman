"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import DataTable from '@/components/ui/DataTable';
import { Search, Map, PlusCircle, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getCurrentUser, ROLES } from '@/lib/auth';
import Cookies from 'js-cookie';

export default function MissionsPage() {
  const router = useRouter();
  const [missions, setMissions] = useState([]);
  const [drones, setDrones] = useState([]);
  const [pilots, setPilots] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // Form states for new mission
  const [missionName, setMissionName] = useState('');
  const [client, setClient] = useState('');
  const [location, setLocation] = useState('');
  const [selectedDroneId, setSelectedDroneId] = useState('');
  const [selectedPilotId, setSelectedPilotId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [description, setDescription] = useState('');
  const [isCreatingMission, setIsCreatingMission] = useState(false);
  const [createMissionError, setCreateMissionError] = useState(null);

  const startDateRef = useRef(null);
  const endDateRef = useRef(null);

  const fetchAllData = async () => {
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

      if (user.role !== ROLES.ADMIN && user.role !== ROLES.PILOT) {
        router.push('/access-denied');
        return;
      }

      const baseUrl = window.location.origin;
      let missionsApiUrl = `${baseUrl}/api/missions`;

      // If the current user is a pilot, fetch only their assigned missions
      if (user.role === ROLES.PILOT && user.pilotId) {
        missionsApiUrl = `${baseUrl}/api/missions?pilotId=${user.pilotId}`;
      }

      // Fetch Missions
      const missionsResponse = await fetch(missionsApiUrl, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!missionsResponse.ok) throw new Error(`Failed to fetch missions: ${missionsResponse.status}`);
      const missionsData = await missionsResponse.json();
      setMissions(missionsData.data);

      // Fetch Drones
      const dronesResponse = await fetch(`${baseUrl}/api/drones`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!dronesResponse.ok) throw new Error(`Failed to fetch drones: ${dronesResponse.status}`);
      const dronesData = await dronesResponse.json();
      setDrones(dronesData.data);

      // Fetch Pilots (only those with 'Pilot' role)
      const pilotsResponse = await fetch(`${baseUrl}/api/pilots`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!pilotsResponse.ok) throw new Error(`Failed to fetch pilots: ${pilotsResponse.status}`);
      const allPilotsData = await pilotsResponse.json();
      // Display all pilots in the dropdown, regardless of status, as per user's request for "users with type pilot"
      const pilotUsers = allPilotsData.data;
      setPilots(pilotUsers);
      console.log('Frontend: Fetched pilots for dropdown:', pilotUsers); // Debug log

    } catch (err) {
      console.error("Failed to fetch data:", err);
      setError("Failed to load data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleCreateMission = async (e) => {
    e.preventDefault();
    setCreateMissionError(null);
    setIsCreatingMission(true);

    try {
      const token = Cookies.get('firebase_id_token');
      if (!token) throw new Error("Authentication token not found.");

      const newMission = {
        name: missionName,
        client,
        location,
        pilotId: selectedPilotId,
        droneId: selectedDroneId,
        date: startDate, // Using start date as the primary mission date for now
        endDate: endDate,
        description,
        status: 'Scheduled', // Default status for new missions
      };

      const response = await fetch('/api/missions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newMission),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const createdMission = await response.json();

      // Create notification for the assigned pilot
      const assignedPilot = pilots.find(p => p.id === selectedPilotId);
      if (assignedPilot && assignedPilot.userId) {
        const notificationResponse = await fetch('/api/notifications', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            userId: assignedPilot.userId,
            type: 'info',
            message: `You have been assigned to a new mission: ${newMission.name} on ${new Date(newMission.date).toLocaleDateString()}.`,
            date: new Date().toISOString(),
            read: false,
          }),
        });

        if (!notificationResponse.ok) {
          console.error("Failed to send notification to pilot.");
        }
      }

      // Refresh missions list
      await fetchAllData();

      // Reset form
      setMissionName('');
      setClient('');
      setLocation('');
      setSelectedDroneId('');
      setSelectedPilotId('');
      setStartDate('');
      setEndDate('');
      setDescription('');

    } catch (err) {
      console.error("Error creating mission:", err);
      setCreateMissionError(err.message || "Failed to create mission.");
    } finally {
      setIsCreatingMission(false);
    }
  };

  const getPilotName = (pilotId) => {
    const pilot = pilots.find(p => p.id === pilotId);
    return pilot ? pilot.name : 'N/A';
  };

  const getDroneModel = (droneId) => {
    const drone = drones.find(d => d.id === droneId);
    return drone ? drone.model : 'N/A';
  };

  const columns = [
    { header: 'Mission Name', accessor: 'name' },
    { header: 'Client', accessor: 'client' },
    { header: 'Location', accessor: 'location' },
    {
      header: 'Drone',
      accessor: 'droneId',
      cell: ({ row }) => getDroneModel(row.droneId),
    },
    {
      header: 'Pilot',
      accessor: 'pilotId',
      cell: ({ row }) => getPilotName(row.pilotId),
    },
    {
      header: 'Start Date',
      accessor: 'date',
      cell: ({ row }) => {
        if (!row || !row.date) return 'N/A';
        return new Date(row.date).toLocaleDateString();
      },
    },
    {
      header: 'End Date',
      accessor: 'endDate',
      cell: ({ row }) => {
        if (!row || !row.endDate) return 'N/A';
        return new Date(row.endDate).toLocaleDateString();
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
      header: 'Actions',
      id: 'actions',
      cell: ({ row }) => {
        const mission = row;
        if (currentUser?.role === ROLES.PILOT && currentUser.pilotId === mission.pilotId) {
          if (mission.status === 'Scheduled') {
            return (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleUpdateMissionStatus(mission.id, 'In Progress')}
                disabled={isCreatingMission} // Reusing for any mission action loading
              >
                Accept Mission
              </Button>
            );
          } else if (mission.status === 'In Progress') {
            return (
              <Button
                variant="default"
                size="sm"
                onClick={() => handleUpdateMissionStatus(mission.id, 'Completed')}
                disabled={isCreatingMission}
              >
                Mark as Completed
              </Button>
            );
          }
        }
        return null; // No actions for other roles or statuses
      },
    },
  ];

  const filteredMissions = missions.filter(mission => {
    // For pilots, only show missions that are 'Scheduled' or 'In Progress'
    if (currentUser?.role === ROLES.PILOT) {
      if (mission.status === 'Completed' || mission.status === 'Cancelled') {
        return false;
      }
    }
    // Apply search term filter
    return (
      (mission.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (mission.client?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (mission.location?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (mission.status?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      getPilotName(mission.pilotId).toLowerCase().includes(searchTerm.toLowerCase()) ||
      getDroneModel(mission.droneId).toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleUpdateMissionStatus = async (missionId, newStatus) => {
    setIsCreatingMission(true); // Use this state for any mission action loading
    try {
      const token = Cookies.get('firebase_id_token');
      if (!token) throw new Error("Authentication token not found.");

      const response = await fetch(`/api/missions?id=${missionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      // Refresh missions list after update
      await fetchAllData();
    } catch (err) {
      console.error(`Error updating mission status to ${newStatus}:`, err);
      setError(`Failed to update mission status: ${err.message || 'Unknown error'}`);
    } finally {
      setIsCreatingMission(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-6 bg-gray-50 min-h-screen">
      {/* Left Column: Mission Scheduling Form (Admin only) */}
      {currentUser?.role === ROLES.ADMIN && (
        <Card className="lg:w-1/3 p-6 space-y-6 shadow-lg rounded-xl">
          <h2 className="text-2xl font-semibold text-gray-800">Mission Scheduling</h2>
          <h3 className="text-xl font-medium text-gray-700 border-b pb-3 mb-4">Create New Mission</h3>
          <form onSubmit={handleCreateMission} className="space-y-4">
            <div>
              <Label htmlFor="missionName" className="text-sm font-medium text-gray-700 mb-1 block">Mission Name</Label>
              <Input
                id="missionName"
                placeholder="Enter mission name"
                value={missionName}
                onChange={(e) => setMissionName(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
            <div>
              <Label htmlFor="client" className="text-sm font-medium text-gray-700 mb-1 block">Client</Label>
              <Input
                id="client"
                placeholder="Select client"
                value={client}
                onChange={(e) => setClient(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
            <div>
              <Label htmlFor="location" className="text-sm font-medium text-gray-700 mb-1 block">Location</Label>
              <Input
                id="location"
                placeholder="Enter location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="drone" className="text-sm font-medium text-gray-700 mb-1 block">Drone</Label>
                <select
                  id="drone"
                  value={selectedDroneId}
                  onChange={(e) => setSelectedDroneId(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                >
                  <option value="">Select drone</option>
                  {drones.map(drone => (
                    <option key={drone.id} value={drone.id}>{drone.model} ({drone.serial})</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="pilot" className="text-sm font-medium text-gray-700 mb-1 block">Pilot</Label>
                <select
                  id="pilot"
                  value={selectedPilotId}
                  onChange={(e) => setSelectedPilotId(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                >
                  <option value="">Select pilot</option>
                  {pilots.map(pilot => (
                    <option key={pilot.id} value={pilot.id}>{pilot.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate" className="text-sm font-medium text-gray-700 mb-1 block">Start Date</Label>
                <div className="relative" onClick={() => startDateRef.current?.showPicker()}>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="pr-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm cursor-pointer"
                    required
                    ref={startDateRef}
                  />
                  <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                </div>
              </div>
              <div>
                <Label htmlFor="endDate" className="text-sm font-medium text-gray-700 mb-1 block">End Date</Label>
                <div className="relative" onClick={() => endDateRef.current?.showPicker()}>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="pr-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm cursor-pointer"
                    required
                    ref={endDateRef}
                  />
                  <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                </div>
              </div>
            </div>
            <div>
              <Label htmlFor="description" className="text-sm font-medium text-gray-700 mb-1 block">Description</Label>
              <textarea
                id="description"
                placeholder="Enter mission description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows="3"
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              ></textarea>
            </div>
            {createMissionError && (
              <p className="text-red-500 text-sm text-center">{createMissionError}</p>
            )}
            <Button type="submit" className="w-full py-2 text-base font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors" disabled={isCreatingMission}>
              {isCreatingMission ? 'Creating Mission...' : 'Create Mission'}
            </Button>
          </form>
        </Card>
      )}

      {/* Right Column: Scheduled Missions */}
      <div className={`space-y-6 ${currentUser?.role === ROLES.ADMIN ? 'lg:w-2/3' : 'lg:w-full'}`}>
        <Card className="p-6 shadow-lg rounded-xl">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            {currentUser?.role === ROLES.PILOT ? 'My Upcoming Missions' : 'Scheduled Missions'}
          </h2>
          <div className="relative mb-4">
            <Input
              type="text"
              placeholder="Search missions by name, client, location, or status"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
          {loading && <p className="text-center text-gray-500 text-base">Loading missions...</p>}
          {error && <p className="text-center text-red-500 text-base">{error}</p>}
          {!loading && !error && filteredMissions.length === 0 && (
            <p className="text-center text-gray-500 text-base">No scheduled missions found.</p>
          )}
          {!loading && !error && filteredMissions.length > 0 && (
            <DataTable columns={columns} data={filteredMissions} />
          )}
        </Card>
      </div>
    </div>
  );
}
