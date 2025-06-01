import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Drone from '@/models/Drone';
import { withAuth } from '@/lib/authMiddleware';
import { successResponse, errorResponse, handleApiError } from '@/lib/apiResponse'; // Import API response helpers

// GET /api/drones
const handleGetDrones = async (request) => {
  await dbConnect();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  try {
    if (id) {
      const drone = await Drone.findOne({ id });
      if (drone) {
        return successResponse(drone);
      }
      return errorResponse('Drone not found', 404);
    }

    const drones = await Drone.find({});
    return successResponse(drones);
  } catch (error) {
    return handleApiError(error);
  }
};

// POST /api/drones
const handlePostDrone = async (request) => {
  await dbConnect();
  try {
    const newDrone = await request.json();
    if (!newDrone.id) {
      const lastDrone = await Drone.findOne().sort({ id: -1 });
      const nextIdNum = lastDrone ? parseInt(lastDrone.id.substring(1)) + 1 : 1;
      newDrone.id = `D${String(nextIdNum).padStart(3, '0')}`;
    }
    const createdDrone = await Drone.create(newDrone);
    return successResponse(createdDrone, 201);
  } catch (error) {
    return handleApiError(error);
  }
};

// PUT /api/drones
const handlePutDrone = async (request) => {
  await dbConnect();
  try {
    const { id, ...updatedFields } = await request.json();
    const updatedDrone = await Drone.findOneAndUpdate({ id }, updatedFields, { new: true, runValidators: true });
    if (updatedDrone) {
      return successResponse(updatedDrone);
    }
    return errorResponse('Drone not found', 404);
  } catch (error) {
    return handleApiError(error);
  }
};

// DELETE /api/drones
const handleDeleteDrone = async (request) => {
  await dbConnect();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return errorResponse('Drone ID is required', 400);
  }

  try {
    const deletedDrone = await Drone.findOneAndDelete({ id });
    if (deletedDrone) {
      return new NextResponse(null, { status: 204 }); // 204 No Content for successful deletion
    }
    return errorResponse('Drone not found', 404);
  } catch (error) {
    return handleApiError(error);
  }
};

// Export wrapped handlers with RBAC
export const GET = withAuth(handleGetDrones, ['Administrator', 'Pilot', 'Viewer']); // All authenticated users can view
export const POST = withAuth(handlePostDrone, ['Administrator']); // Only admins can create
export const PUT = withAuth(handlePutDrone, ['Administrator']); // Only admins can update
export const DELETE = withAuth(handleDeleteDrone, ['Administrator']); // Only admins can delete
