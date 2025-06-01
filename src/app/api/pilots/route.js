import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Pilot from '@/models/Pilot';
import { withAuth } from '@/lib/authMiddleware';
import { successResponse, errorResponse, handleApiError } from '@/lib/apiResponse'; // Import API response helpers

// GET /api/pilots
const handleGetPilots = async (request) => {
  await dbConnect();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  try {
    if (id) {
      const pilot = await Pilot.findOne({ id });
      if (pilot) {
        return successResponse(pilot);
      }
      return errorResponse('Pilot not found', 404);
    }

    const pilots = await Pilot.find({});
    console.log('API: Fetching all pilots:', pilots); // Debug log
    return successResponse(pilots);
  } catch (error) {
    return handleApiError(error);
  }
};

// POST /api/pilots
const handlePostPilot = async (request) => {
  await dbConnect();
  try {
    const newPilot = await request.json();
    if (!newPilot.id) {
      const lastPilot = await Pilot.findOne().sort({ id: -1 });
      const nextIdNum = lastPilot ? parseInt(lastPilot.id.substring(1)) + 1 : 1;
      newPilot.id = `P${String(nextIdNum).padStart(3, '0')}`;
    }
    const createdPilot = await Pilot.create(newPilot);
    return successResponse(createdPilot, 201);
  } catch (error) {
    return handleApiError(error);
  }
};

// PUT /api/pilots
const handlePutPilot = async (request) => {
  await dbConnect();
  try {
    const { id, ...updatedFields } = await request.json();
    const updatedPilot = await Pilot.findOneAndUpdate({ id }, updatedFields, { new: true, runValidators: true });
    if (updatedPilot) {
      return successResponse(updatedPilot);
    }
    return errorResponse('Pilot not found', 404);
  } catch (error) {
    return handleApiError(error);
  }
};

// DELETE /api/pilots
const handleDeletePilot = async (request) => {
  await dbConnect();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return errorResponse('Pilot ID is required', 400);
  }

  try {
    const deletedPilot = await Pilot.findOneAndDelete({ id });
    if (deletedPilot) {
      return new NextResponse(null, { status: 204 }); // 204 No Content for successful deletion
    }
    return errorResponse('Pilot not found', 404);
  } catch (error) {
    return handleApiError(error);
  }
};

// Export wrapped handlers with RBAC
export const GET = withAuth(handleGetPilots, ['Administrator', 'Pilot', 'Viewer']); // All authenticated users can view
export const POST = withAuth(handlePostPilot, ['Administrator']); // Only admins can create
export const PUT = withAuth(handlePutPilot, ['Administrator', 'Pilot']); // Admins or the pilot themselves can update
export const DELETE = withAuth(handleDeletePilot, ['Administrator']); // Only admins can delete
