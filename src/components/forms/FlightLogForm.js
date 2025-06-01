// src/components/forms/FlightLogForm.js
"use client";

import React from 'react';
import { useForm } from 'react-hook-form';
import { PlusCircle } from 'lucide-react'; // Import PlusCircle icon
import { drones as mockDrones, missions as mockMissions } from '@/lib/data'; // Using missions for mission types

export default function FlightLogForm() {
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = (data) => {
    console.log("Flight Log Data:", data);
    // In a real application, this data would be sent to an API
    alert("Flight log submitted successfully! (Check console for data)");
  };

  // Prepare options for dropdowns
  const droneOptions = mockDrones.map(drone => ({ value: drone.id, label: `${drone.name} (${drone.serial})` }));
  const missionTypeOptions = [
    { value: 'Training', label: 'Training' },
    { value: 'Commercial', label: 'Commercial' },
    { value: 'Inspection', label: 'Inspection' },
    { value: 'Agriculture', label: 'Agriculture' },
    { value: 'Surveillance', label: 'Surveillance' },
    { value: 'Delivery', label: 'Delivery' },
    { value: 'Photography', label: 'Photography' },
    ...mockMissions.map(mission => ({ value: mission.name, label: mission.name })) // Add mock missions as types
  ];

  return (
    <div className="bg-white p-8 rounded-lg shadow-md max-w-2xl mx-auto">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Log New Flight</h2>
      <p className="text-gray-600 mb-6 text-center">Enter the details of your recent flight operation.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Date */}
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input
            type="date"
            id="date"
            {...register('date', { required: 'Date is required' })}
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date.message}</p>}
        </div>

        {/* Time */}
        <div>
          <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-1">Time</label>
          <input
            type="time"
            id="time"
            {...register('time', { required: 'Time is required' })}
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.time && <p className="text-red-500 text-xs mt-1">{errors.time.message}</p>}
        </div>

        {/* Drone Used */}
        <div>
          <label htmlFor="droneUsed" className="block text-sm font-medium text-gray-700 mb-1">Drone Used</label>
          <select
            id="droneUsed"
            {...register('droneUsed', { required: 'Drone is required' })}
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Drone</option>
            {droneOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          {errors.droneUsed && <p className="text-red-500 text-xs mt-1">{errors.droneUsed.message}</p>}
        </div>

        {/* Mission Type */}
        <div>
          <label htmlFor="missionType" className="block text-sm font-medium text-gray-700 mb-1">Mission Type</label>
          <select
            id="missionType"
            {...register('missionType', { required: 'Mission Type is required' })}
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Mission Type</option>
            {missionTypeOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          {errors.missionType && <p className="text-red-500 text-xs mt-1">{errors.missionType.message}</p>}
        </div>

        {/* Location */}
        <div className="md:col-span-2">
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">Location</label>
          <input
            type="text"
            id="location"
            {...register('location', { required: 'Location is required' })}
            placeholder="Enter flight location (e.g., Harare Agricultural Showgrounds)"
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location.message}</p>}
        </div>

        {/* Weather Conditions */}
        <div className="md:col-span-2">
          <label htmlFor="weatherConditions" className="block text-sm font-medium text-gray-700 mb-1">Weather Conditions</label>
          <input
            type="text"
            id="weatherConditions"
            {...register('weatherConditions', { required: 'Weather conditions are required' })}
            placeholder="e.g., Sunny, 25°C, Wind 5km/h E"
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.weatherConditions && <p className="text-red-500 text-xs mt-1">{errors.weatherConditions.message}</p>}
        </div>

        {/* Incidents/Notes */}
        <div className="md:col-span-2">
          <label htmlFor="incidentsNotes" className="block text-sm font-medium text-gray-700 mb-1">Incidents/Notes</label>
          <textarea
            id="incidentsNotes"
            {...register('incidentsNotes')}
            placeholder="Describe any incidents, observations, or additional notes"
            rows="4"
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          ></textarea>
        </div>

        {/* Submit Button */}
        <div className="md:col-span-2 text-center">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg flex items-center justify-center mx-auto transition-colors"
          >
            <PlusCircle size={20} className="mr-2" /> Submit Flight Log
          </button>
        </div>
      </form>
    </div>
  );
}
