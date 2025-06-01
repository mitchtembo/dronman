import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import FlightLog from '@/models/FlightLog';
import { withAuth } from '@/lib/authMiddleware';
import { successResponse, errorResponse, handleApiError } from '@/lib/apiResponse'; // Import API response helpers

// GET /api/flights
const handleGetFlightLogs = async (request) => {
  await dbConnect();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  try {
    if (id) {
      const flightLog = await FlightLog.findOne({ id });
      if (flightLog) {
        return successResponse(flightLog);
      }
      return errorResponse('Flight Log not found', 404);
    }

    const flightLogs = await FlightLog.find({});
    return successResponse(flightLogs);
  } catch (error) {
    return handleApiError(error);
  }
};

// POST /api/flights
const handlePostFlightLog = async (request) => {
  await dbConnect();
  try {
    const newFlightLog = await request.json();
    if (!newFlightLog.id) {
      const lastLog = await FlightLog.findOne().sort({ id: -1 });
      const nextIdNum = lastLog ? parseInt(lastLog.id.substring(2)) + 1 : 1;
      newFlightLog.id = `FL${String(nextIdNum).padStart(3, '0')}`;
    }
    const createdFlightLog = await FlightLog.create(newFlightLog);
    return successResponse(createdFlightLog, 201);
  } catch (error) {
    return handleApiError(error);
  }
};

// PUT /api/flights
const handlePutFlightLog = async (request) => {
  await dbConnect();
  try {
    const { id, ...updatedFields } = await request.json();
    const updatedFlightLog = await FlightLog.findOneAndUpdate({ id }, updatedFields, { new: true, runValidators: true });
    if (updatedFlightLog) {
      return successResponse(updatedFlightLog);
    }
    return errorResponse('Flight Log not found', 404);
  } catch (error) {
    return handleApiError(error);
  }
};

// DELETE /api/flights
const handleDeleteFlightLog = async (request) => {
  await dbConnect();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return errorResponse('Flight Log ID is required', 400);
  }

  try {
    const deletedFlightLog = await FlightLog.findOneAndDelete({ id });
    if (deletedFlightLog) {
      return new NextResponse(null, { status: 204 }); // 204 No Content for successful deletion
    }
    return errorResponse('Flight Log not found', 404);
  } catch (error) {
    return handleApiError(error);
  }
};

// Export wrapped handlers with RBAC
export const GET = withAuth(handleGetFlightLogs, ['Administrator', 'Pilot', 'Viewer']); // All authenticated users can view
export const POST = withAuth(handlePostFlightLog, ['Administrator', 'Pilot']); // Admins and Pilots can create
export const PUT = withAuth(handlePutFlightLog, ['Administrator', 'Pilot']); // Admins or the pilot who logged it can update
export const DELETE = withAuth(handleDeleteFlightLog, ['Administrator']); // Only admins can delete
