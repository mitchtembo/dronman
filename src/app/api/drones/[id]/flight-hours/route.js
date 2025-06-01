// src/app/api/drones/[id]/flight-hours/route.js
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import FlightLog from '@/models/FlightLog';
import mongoose from 'mongoose';
import { withAuth } from '@/lib/authMiddleware';
import { successResponse, errorResponse, handleApiError } from '@/lib/apiResponse'; // Import API response helpers

const handleGetDroneFlightHours = async (request, { params }) => {
  await dbConnect();
  const { id } = params; // droneId from the URL

  try {
    const result = await FlightLog.aggregate([
      {
        $match: {
          droneId: id, // Match by custom droneId string
        },
      },
      {
        $group: {
          _id: '$droneId',
          totalMinutes: { $sum: '$duration' },
        },
      },
    ]);

    if (result.length > 0) {
      const totalHours = parseFloat((result[0].totalMinutes / 60).toFixed(1));
      return successResponse({ droneId: id, totalHours });
    } else {
      return successResponse({ droneId: id, totalHours: 0 });
    }
  } catch (error) {
    return handleApiError(error);
  }
};

export const GET = withAuth(handleGetDroneFlightHours, ['Administrator', 'Pilot', 'Viewer']); // All authenticated users can view
