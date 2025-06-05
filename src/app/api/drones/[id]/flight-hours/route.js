// src/app/api/drones/[id]/flight-hours/route.js
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/authMiddleware';
import { successResponse, errorResponse, handleApiError } from '@/lib/apiResponse';
import { db } from '@/lib/firebaseAdmin'; // Import Firestore db

const handleGetDroneFlightHours = async (request, { params }) => {
  const { id } = params; // droneId from the URL

  try {
    const flightLogsSnapshot = await db.collection('flightlogs')
      .where('droneId', '==', id)
      .get();

    let totalMinutes = 0;
    flightLogsSnapshot.docs.forEach(doc => {
      totalMinutes += doc.data().duration || 0;
    });

    const totalHours = parseFloat((totalMinutes / 60).toFixed(1));
    return successResponse({ droneId: id, totalHours });

  } catch (error) {
    return handleApiError(error);
  }
};

export const GET = withAuth(handleGetDroneFlightHours, ['Administrator', 'Pilot', 'Viewer']); // All authenticated users can view
