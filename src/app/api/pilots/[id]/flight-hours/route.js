// src/app/api/pilots/[id]/flight-hours/route.js
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import FlightLog from '@/models/FlightLog';
import mongoose from 'mongoose';
import { withAuth } from '@/lib/authMiddleware';
import { successResponse, errorResponse, handleApiError } from '@/lib/apiResponse'; // Import API response helpers

const handleGetPilotFlightHours = async (request, { params }) => {
  await dbConnect();
  const { id } = params; // pilotId from the URL

  try {
    // RBAC: Admin can view any pilot's flight hours, Pilot can view their own
    // The `withAuth` middleware already ensures authentication.
    // Additional check for pilot's own data if not admin:
    // const currentUser = request.user; // User info attached by withAuth
    // if (currentUser.role !== 'Administrator' && currentUser.pilotId !== id) {
    //   return errorResponse('Forbidden: You can only view your own flight hours', 403);
    // }

    const result = await FlightLog.aggregate([
      {
        $match: {
          pilotId: id, // Match by custom pilotId string
        },
      },
      {
        $group: {
          _id: '$pilotId',
          totalMinutes: { $sum: '$duration' },
        },
      },
    ]);

    if (result.length > 0) {
      const totalHours = parseFloat((result[0].totalMinutes / 60).toFixed(1));
      return successResponse({ pilotId: id, totalHours });
    } else {
      return successResponse({ pilotId: id, totalHours: 0 });
    }
  } catch (error) {
    return handleApiError(error);
  }
};

export const GET = withAuth(handleGetPilotFlightHours, ['Administrator', 'Pilot', 'Viewer']); // All authenticated users can view
