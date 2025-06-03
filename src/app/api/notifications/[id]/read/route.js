import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/authMiddleware';
import { successResponse, errorResponse, handleApiError } from '@/lib/apiResponse';
import { db } from '@/lib/firebaseAdmin';

// PUT /api/notifications/[id]/read
const handlePutNotificationReadStatus = async (request, { params }) => {
  const { id } = params; // notificationId
  const requestingUser = request.user;

  try {
    const notificationRef = db.collection('notifications').doc(id);
    const notificationDoc = await notificationRef.get();

    if (!notificationDoc.exists) {
      return errorResponse('Notification not found', 404);
    }

    const notificationData = { id: notificationDoc.id, ...notificationDoc.data() };

    // Admins can mark any notification as read, users can only mark their own
    if (requestingUser.role !== 'Administrator' && requestingUser.uid !== notificationData.userId) {
      return errorResponse('Forbidden: You can only update the read status of your own notifications', 403);
    }

    // Update the 'read' field to true
    await notificationRef.update({ read: true });

    const updatedNotificationDoc = await notificationRef.get();
    return successResponse({ id: updatedNotificationDoc.id, ...updatedNotificationDoc.data() });
  } catch (error) {
    return handleApiError(error);
  }
};

export const PUT = withAuth(handlePutNotificationReadStatus, ['Administrator', 'Pilot', 'Viewer']); // Admins can update any, users can update their own
