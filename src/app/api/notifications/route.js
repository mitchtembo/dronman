import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Notification from '@/models/Notification';
import { withAuth } from '@/lib/authMiddleware';
import { successResponse, errorResponse, handleApiError } from '@/lib/apiResponse'; // Import API response helpers

// GET /api/notifications
const handleGetNotifications = async (request) => {
  await dbConnect();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const userId = searchParams.get('userId'); // To filter by user

  try {
    if (id) {
      const notification = await Notification.findOne({ id });
      // RBAC: Admin can view any, user can view their own (handled by withAuth)
      return successResponse(notification);
    }

    let query = {};
    if (userId) {
      query.userId = userId;
    }

    const notifications = await Notification.find(query);
    return successResponse(notifications);
  } catch (error) {
    return handleApiError(error);
  }
};

// POST /api/notifications
const handlePostNotification = async (request) => {
  await dbConnect();
  try {
    const newNotification = await request.json();
    if (!newNotification.id) {
      const lastNotification = await Notification.findOne().sort({ id: -1 });
      const nextIdNum = lastNotification ? parseInt(lastNotification.id) + 1 : 1;
      newNotification.id = String(nextIdNum);
    }
    const createdNotification = await Notification.create(newNotification);
    return successResponse(createdNotification, 201);
  } catch (error) {
    return handleApiError(error);
  }
};

// PUT /api/notifications
const handlePutNotification = async (request) => {
  await dbConnect();
  try {
    const { id, ...updatedFields } = await request.json();
    const updatedNotification = await Notification.findOneAndUpdate({ id }, updatedFields, { new: true, runValidators: true });
    if (updatedNotification) {
      return successResponse(updatedNotification);
    }
    return errorResponse('Notification not found', 404);
  } catch (error) {
    return handleApiError(error);
  }
};

// DELETE /api/notifications
const handleDeleteNotification = async (request) => {
  await dbConnect();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return errorResponse('Notification ID is required', 400);
  }

  try {
    const deletedNotification = await Notification.findOneAndDelete({ id });
    if (deletedNotification) {
      return new NextResponse(null, { status: 204 }); // 204 No Content for successful deletion
    }
    return errorResponse('Notification not found', 404);
  } catch (error) {
    return handleApiError(error);
  }
};

// Export wrapped handlers with RBAC
export const GET = withAuth(handleGetNotifications, ['Administrator', 'Pilot', 'Viewer']); // Admins can view all, others view their own (logic in handler)
export const POST = withAuth(handlePostNotification, ['Administrator']); // Only admins can create
export const PUT = withAuth(handlePutNotification, ['Administrator', 'Pilot', 'Viewer']); // Admins or the user themselves can update (logic in handler)
export const DELETE = withAuth(handleDeleteNotification, ['Administrator']); // Only admins can delete
