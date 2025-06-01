"use client";

import React, { useState, useEffect } from 'react';
import { PlusCircle, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { getCurrentUser } from '@/lib/auth'; // Import getCurrentUser
import { pilots as mockPilots, drones as mockDrones } from '@/lib/data';

export default function SchedulePage() {
  const [missions, setMissions] = useState([]);
  const [pilots, setPilots] = useState([]); // State to store fetched pilots
  const [drones, setDrones] = useState([]); // State to store fetched drones
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [newMission, setNewMission] = useState({
    name: '',
    pilotId: '',
    droneId: '',
    date: '',
    time: '',
    type: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchScheduleData = async () => {
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
        const authHeaders = {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        };

        // Fetch Missions
        const missionsResponse = await fetch(`${baseUrl}/api/missions`, authHeaders);
        if (!missionsResponse.ok) throw new Error(`HTTP error! status: ${missionsResponse.status}`);
        const missionsData = await missionsResponse.json();
        setMissions(missionsData.data);

        // Fetch Pilots for dropdown
        const pilotsResponse = await fetch(`${baseUrl}/api/pilots`, authHeaders);
        if (!pilotsResponse.ok) throw new Error(`HTTP error! status: ${pilotsResponse.status}`);
        const pilotsData = await pilotsResponse.json();
        setPilots(pilotsData.data);

        // Fetch Drones for dropdown
        const dronesResponse = await fetch(`${baseUrl}/api/drones`, authHeaders);
        if (!dronesResponse.ok) throw new Error(`HTTP error! status: ${dronesResponse.status}`);
        const dronesData = await dronesResponse.json();
        setDrones(dronesData.data);

      } catch (err) {
        console.error("Failed to fetch schedule data:", err);
        setError("Failed to load schedule data. Please try again later.");
        setMissions([]);
        setPilots([]);
        setDrones([]);
      } finally {
        setLoading(false);
      }
    };
    fetchScheduleData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewMission(prev => ({ ...prev, [name]: value }));
  };

  const handleAssignMission = async () => { // Make async
    const { name, pilotId, droneId, date, time, type } = newMission;

    if (!name || !pilotId || !droneId || !date || !time || !type) {
      alert('Please fill all required fields.');
      return;
    }

    const currentUser = getCurrentUser();
    const token = currentUser?.token;
    if (!token) {
      alert("Authentication required to assign mission.");
      return;
    }

    try {
      const response = await fetch('/api/missions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          pilotId,
          droneId,
          date: `${date}T${time}:00.000Z`, // Combine date and time for ISO format
          status: 'Scheduled', // Default status for new missions
          type,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const createdMission = await response.json();
      setMissions(prev => [...prev, createdMission.data]); // Add new mission to state
      alert('Mission assigned successfully!');
      setIsAssignmentModalOpen(false);
      setNewMission({ name: '', pilotId: '', droneId: '', date: '', time: '', type: '' }); // Reset form
    } catch (err) {
      console.error("Failed to assign mission:", err);
      alert(`Failed to assign mission: ${err.message}`);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-800">Mission Scheduling</h1>
        <Button onClick={() => setIsAssignmentModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
          <PlusCircle size={20} className="mr-2" /> Assign New Mission
        </Button>
      </div>

      {/* Calendar Placeholder */}
      <div className="bg-white p-6 rounded-lg shadow-md min-h-[400px] flex items-center justify-center text-gray-500 text-lg">
        <CalendarIcon size={48} className="mr-4" />
        <p>Calendar interface will be displayed here (e.g., using react-big-calendar).</p>
      </div>

      {/* List of Missions (for now, later integrate with calendar) */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Upcoming Missions</h2>
        {missions.length === 0 ? (
          <p className="text-gray-500">No missions scheduled yet.</p>
        ) : (
          <ul className="space-y-2">
            {missions.map(mission => (
              <li key={mission.id} className="p-3 border border-gray-200 rounded-md flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-700">{mission.name} ({mission.type})</p>
                  <p className="text-sm text-gray-500">
                    {mission.date} {mission.time} | Pilot: {mission.pilotName || mission.pilotId} | Drone: {mission.droneModel || mission.droneId}
                  </p>
                </div>
                {/* Add action buttons like Edit/Cancel */}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Assignment Modal */}
      <Dialog open={isAssignmentModalOpen} onOpenChange={setIsAssignmentModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign New Mission</DialogTitle>
            <DialogDescription>
              Fill in the details to schedule and assign a new mission.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 py-4">
            <Input
              name="name"
              placeholder="Mission Name"
              value={newMission.name}
              onChange={handleInputChange}
            />
            <select
              name="pilotId"
              value={newMission.pilotId}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Pilot</option>
              {pilots.map(pilot => (
                <option key={pilot.id} value={pilot.id}>{pilot.name}</option>
              ))}
            </select>
            <select
              name="droneId"
              value={newMission.droneId}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Drone</option>
              {drones.map(drone => (
                <option key={drone.id} value={drone.id}>{drone.model} ({drone.serial})</option>
              ))}
            </select>
            <Input
              type="date"
              name="date"
              value={newMission.date}
              onChange={handleInputChange}
            />
            <Input
              type="time"
              name="time"
              value={newMission.time}
              onChange={handleInputChange}
            />
            <Input
              name="type"
              placeholder="Mission Type (e.g., Site Survey)"
              value={newMission.type}
              onChange={handleInputChange}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignmentModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAssignMission}>Assign Mission</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
