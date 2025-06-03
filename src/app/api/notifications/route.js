import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/authMiddleware';
import { successResponse, errorResponse, handleApiError } from '@/lib/apiResponse';
import { db } from '@/lib/firebaseAdmin'; // Import Firestore db

/**
 * @openapi
 * components:
 *   schemas:
 *     Notification:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: The Firestore document ID of the notification.
 *           readOnly: true
 *         userId:
 *           type: string
 *           description: The Firebase Auth UID of the user to whom the notification is addressed.
 *         type:
 *           type: string
 *           enum: [alert, info, warning]
 *           description: The type of notification.
 *         message:
 *           type: string
 *           description: The content of the notification.
 *         date:
 *           type: string
 *           format: date-time
 *           description: The date and time the notification was created.
 *         read:
 *           type: boolean
 *           description: Indicates whether the notification has been read by the user.
 *       required:
 *         - userId
 *         - type
 *         - message
 *         - date
 *         - read
 *
 * tags:
 *   - name: Notifications
 *     description: System and user-specific notifications
 *
 * /api/notifications:
 *   get:
 *     summary: Retrieve a list of notifications or a single notification by ID.
 *     description: Fetches all notifications (Admin only) or notifications for the requesting user.
 *     tags:
 *       - Notifications
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: string
 *         description: Optional. The Firestore document ID of the notification to retrieve.
 *     responses:
 *       200:
 *         description: A list of notifications or a single notification object.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Notification'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *   post:
 *     summary: Create a new notification.
 *     description: Creates a new notification record. Only Administrators can create notifications.
 *     tags:
 *       - Notifications
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Notification'
 *     responses:
 *       201:
 *         description: Notification created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Notification'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 * /api/notifications/{id}:
 *   put:
 *     summary: Update an existing notification.
 *     description: Updates a notification's details. Administrators can update any, users can update their own (e.g., mark as read).
 *     tags:
 *       - Notifications
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The Firestore document ID of the notification to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Notification'
 *     responses:
 *       200:
 *         description: Notification updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Notification'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *   delete:
 *     summary: Delete a notification.
 *     description: Deletes a notification record. Only Administrators can delete notifications.
 *     tags:
 *       - Notifications
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The Firestore document ID of the notification to delete.
 *     responses:
 *       204:
 *         description: Notification deleted successfully.
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

// GET /api/notifications
const handleGetNotifications = async (request) => {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const requestingUser = request.user;

  try {
    if (id) {
      const notificationDoc = await db.collection('notifications').doc(id).get();
      if (notificationDoc.exists) {
        const notificationData = { id: notificationDoc.id, ...notificationDoc.data() };
        // Non-admins can only view their own notifications
        if (requestingUser.role !== 'Administrator' && requestingUser.uid !== notificationData.userId) {
          return errorResponse('Forbidden: You can only view your own notifications', 403);
        }
        return successResponse(notificationData);
      }
      return errorResponse('Notification not found', 404);
    }

    let query = db.collection('notifications');

    // Non-admins can only see their own notifications
    if (requestingUser.role !== 'Administrator') {
      query = query.where('userId', '==', requestingUser.uid);
    }

    const notificationsSnapshot = await query.get();
    const notifications = notificationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return successResponse(notifications);
  } catch (error) {
    return handleApiError(error);
  }
};

// POST /api/notifications
const handlePostNotification = async (request) => {
  try {
    const newNotificationData = await request.json();
    const newNotificationRef = await db.collection('notifications').add(newNotificationData);
    return successResponse({ id: newNotificationRef.id, ...newNotificationData }, 201);
  } catch (error) {
    return handleApiError(error);
  }
};

// PUT /api/notifications
const handlePutNotification = async (request) => {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const requestingUser = request.user;

  if (!id) {
    return errorResponse('Notification ID is required', 400);
  }

  try {
    const updatedFields = await request.json();
    const notificationRef = db.collection('notifications').doc(id);
    const notificationDoc = await notificationRef.get();

    if (!notificationDoc.exists) {
      return errorResponse('Notification not found', 404);
    }

    const notificationData = { id: notificationDoc.id, ...notificationDoc.data() };

    // Admins can update any notification, users can only update their own
    if (requestingUser.role !== 'Administrator' && requestingUser.uid !== notificationData.userId) {
      return errorResponse('Forbidden: You can only update your own notifications', 403);
    }

    await notificationRef.update(updatedFields);
    const updatedNotificationDoc = await notificationRef.get();
    return successResponse({ id: updatedNotificationDoc.id, ...updatedNotificationDoc.data() });
  } catch (error) {
    return handleApiError(error);
  }
};

// DELETE /api/notifications
const handleDeleteNotification = async (request) => {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const requestingUser = request.user;

  if (!id) {
    return errorResponse('Notification ID is required', 400);
  }

  try {
    const notificationRef = db.collection('notifications').doc(id);
    const notificationDoc = await notificationRef.get();

    if (!notificationDoc.exists) {
      return errorResponse('Notification not found', 404);
    }

    // Only Admins can delete notifications
    if (requestingUser.role !== 'Administrator') {
      return errorResponse('Forbidden: Only administrators can delete notifications', 403);
    }

    await notificationRef.delete();
    return new NextResponse(null, { status: 204 }); // 204 No Content for successful deletion
  } catch (error) {
    return handleApiError(error);
  }
};

// Export wrapped handlers with RBAC
export const GET = withAuth(handleGetNotifications, ['Administrator', 'Pilot', 'Viewer']); // Admins can view all, others view their own (logic in handler)
export const POST = withAuth(handlePostNotification, ['Administrator']); // Only admins can create
export const PUT = withAuth(handlePutNotification, ['Administrator', 'Pilot', 'Viewer']); // Admins or the user themselves can update (logic in handler)
export const DELETE = withAuth(handleDeleteNotification, ['Administrator']); // Only admins can delete
