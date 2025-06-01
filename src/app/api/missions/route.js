import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Mission from '@/models/Mission';
import { withAuth } from '@/lib/authMiddleware';
import { successResponse, errorResponse, handleApiError } from '@/lib/apiResponse'; // Import API response helpers

// GET /api/missions
const handleGetMissions = async (request) => {
  await dbConnect();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  try {
    if (id) {
      const mission = await Mission.findOne({ id });
      if (mission) {
        return successResponse(mission);
      }
      return errorResponse('Mission not found', 404);
    }

    const missions = await Mission.find({});
    return successResponse(missions);
  } catch (error) {
    return handleApiError(error);
  }
};

// POST /api/missions
const handlePostMission = async (request) => {
  await dbConnect();
  try {
    const newMission = await request.json();
    if (!newMission.id) {
      const lastMission = await Mission.findOne().sort({ id: -1 });
      const nextIdNum = lastMission ? parseInt(lastMission.id.substring(1)) + 1 : 1;
      newMission.id = `M${String(nextIdNum).padStart(3, '0')}`;
    }
    const createdMission = await Mission.create(newMission);
    return successResponse(createdMission, 201);
  } catch (error) {
    return handleApiError(error);
  }
};

// PUT /api/missions
const handlePutMission = async (request) => {
  await dbConnect();
  try {
    const { id, ...updatedFields } = await request.json();
    const updatedMission = await Mission.findOneAndUpdate({ id }, updatedFields, { new: true, runValidators: true });
    if (updatedMission) {
      return successResponse(updatedMission);
    }
    return errorResponse('Mission not found', 404);
  } catch (error) {
    return handleApiError(error);
  }
};

// DELETE /api/missions
const handleDeleteMission = async (request) => {
  await dbConnect();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return errorResponse('Mission ID is required', 400);
  }

  try {
    const deletedMission = await Mission.findOneAndDelete({ id });
    if (deletedMission) {
      return new NextResponse(null, { status: 204 }); // 204 No Content for successful deletion
    }
    return errorResponse('Mission not found', 404);
  } catch (error) {
    return handleApiError(error);
  }
};

// Export wrapped handlers with RBAC
export const GET = withAuth(handleGetMissions, ['Administrator', 'Pilot', 'Viewer']); // All authenticated users can view
export const POST = withAuth(handlePostMission, ['Administrator']); // Only admins can create
export const PUT = withAuth(handlePutMission, ['Administrator']); // Only admins can update
export const DELETE = withAuth(handleDeleteMission, ['Administrator']); // Only admins can delete
