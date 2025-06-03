// src/app/api/pilots/[id]/flight-hours/route.js
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/authMiddleware';
import { successResponse, errorResponse, handleApiError } from '@/lib/apiResponse';
import { db } from '@/lib/firebaseAdmin'; // Import Firestore db

const handleGetPilotFlightHours = async (request, { params }) => {
  const { id } = params; // pilotId from the URL
  const requestingUser = request.user; // User info attached by withAuth

  try {
    // RBAC: Admin can view any pilot's flight hours, Pilot can view their own
    if (requestingUser.role !== 'Administrator' && requestingUser.pilotId !== id) {
      return errorResponse('Forbidden: You can only view your own flight hours', 403);
    }

    const flightLogsSnapshot = await db.collection('flightlogs')
      .where('pilotId', '==', id)
      .get();

    let totalMinutes = 0;
    flightLogsSnapshot.docs.forEach(doc => {
      totalMinutes += doc.data().duration || 0;
    });

    const totalHours = parseFloat((totalMinutes / 60).toFixed(1));
    return successResponse({ pilotId: id, totalHours });

  } catch (error) {
    return handleApiError(error);
  }
};

export const GET = withAuth(handleGetPilotFlightHours, ['Administrator', 'Pilot', 'Viewer']); // All authenticated users can view
