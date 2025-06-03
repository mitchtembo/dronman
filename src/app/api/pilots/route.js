import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin'; // Import db from firebaseAdmin
import { withAuth } from '@/lib/authMiddleware';
import { successResponse, errorResponse, handleApiError } from '@/lib/apiResponse';

/**
 * @openapi
 * components:
 *   schemas:
 *     Certification:
 *       type: object
 *       properties:
 *         type:
 *           type: string
 *           description: Type of certification (e.g., "Part 107", "Advanced").
 *         issueDate:
 *           type: string
 *           format: date
 *           description: Date the certification was issued.
 *         expires:
 *           type: string
 *           format: date
 *           description: Date the certification expires.
 *         status:
 *           type: string
 *           enum: [Active, Expiring Soon Notified, Expired]
 *           description: Current status of the certification.
 *       required:
 *         - type
 *         - issueDate
 *         - expires
 *         - status
 *     Pilot:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: The Firestore document ID of the pilot.
 *           readOnly: true
 *         userId:
 *           type: string
 *           description: The Firebase Auth UID of the associated user.
 *         name:
 *           type: string
 *           description: The full name of the pilot.
 *         email:
 *           type: string
 *           format: email
 *           description: The email address of the pilot.
 *         contact:
 *           type: string
 *           description: Additional contact information for the pilot.
 *         status:
 *           type: string
 *           enum: [Active, Inactive, On Leave]
 *           description: The current employment status of the pilot.
 *         certifications:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Certification'
 *           description: A list of certifications held by the pilot.
 *       required:
 *         - userId
 *         - name
 *         - email
 *         - status
 *
 * tags:
 *   - name: Pilots
 *     description: Pilot management operations
 *
 * /api/pilots:
 *   get:
 *     summary: Retrieve a list of pilots or a single pilot by ID.
 *     description: Fetches all pilots (Admin only) or a specific pilot by their Firestore document ID.
 *     tags:
 *       - Pilots
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: string
 *         description: Optional. The Firestore document ID of the pilot to retrieve.
 *     responses:
 *       200:
 *         description: A list of pilots or a single pilot object.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Pilot'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *   post:
 *     summary: Create a new pilot.
 *     description: Creates a new pilot record and links it to an existing user. Only Administrators can create pilots.
 *     tags:
 *       - Pilots
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 description: The Firebase Auth UID of the user to associate with this pilot.
 *               name:
 *                 type: string
 *                 description: The full name of the pilot.
 *               email:
 *                 type: string
 *                 format: email
 *                 description: The email address of the pilot.
 *               contact:
 *                 type: string
 *                 description: Additional contact information.
 *               status:
 *                 type: string
 *                 enum: [Active, Inactive, On Leave]
 *                 description: The employment status.
 *               certifications:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Certification'
 *                 description: List of certifications.
 *             required:
 *               - userId
 *               - name
 *               - email
 *               - status
 *     responses:
 *       201:
 *         description: Pilot created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Pilot'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 * /api/pilots/{id}:
 *   put:
 *     summary: Update an existing pilot.
 *     description: Updates a pilot's details. Only Administrators can update pilots.
 *     tags:
 *       - Pilots
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The Firestore document ID of the pilot to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: New full name of the pilot.
 *               email:
 *                 type: string
 *                 format: email
 *                 description: New email address of the pilot.
 *               contact:
 *                 type: string
 *                 description: New contact information.
 *               status:
 *                 type: string
 *                 enum: [Active, Inactive, On Leave]
 *                 description: New employment status.
 *               certifications:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Certification'
 *                 description: Updated list of certifications.
 *     responses:
 *       200:
 *         description: Pilot updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Pilot'
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
 *     summary: Delete a pilot.
 *     description: Deletes a pilot record and unlinks it from the associated user. Only Administrators can delete pilots.
 *     tags:
 *       - Pilots
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The Firestore document ID of the pilot to delete.
 *     responses:
 *       204:
 *         description: Pilot deleted successfully.
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

// GET /api/pilots
const handleGetPilots = async (request) => {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id'); // Firestore document ID for pilot

    if (id) {
      const pilotDoc = await db.collection('pilots').doc(id).get();
      if (pilotDoc.exists) {
        return successResponse({ id: pilotDoc.id, ...pilotDoc.data() });
      }
      return errorResponse('Pilot not found', 404);
    }

    const pilotsSnapshot = await db.collection('pilots').get();
    const pilots = pilotsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log('API: Fetching all pilots:', pilots); // Debug log
    return successResponse(pilots);
  } catch (error) {
    return handleApiError(error);
  }
};

// POST /api/pilots
const handlePostPilot = async (request) => {
  try {
    const newPilotData = await request.json();
    const { userId, ...pilotFields } = newPilotData; // Expect userId to link to a user

    if (!userId) {
      return errorResponse('userId is required to create a pilot', 400);
    }

    // Add new pilot document to Firestore
    const pilotDocRef = await db.collection('pilots').add({
      ...pilotFields,
      userId: userId, // Link to the user's UID
    });

    // Update the corresponding user document with the new pilotId
    await db.collection('users').doc(userId).update({
      pilotId: pilotDocRef.id,
    });

    const createdPilot = { id: pilotDocRef.id, ...newPilotData };
    return successResponse(createdPilot, 201);
  } catch (error) {
    return handleApiError(error);
  }
};

// PUT /api/pilots/[id] (assuming update by Firestore document ID)
const handlePutPilot = async (request) => {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id'); // Get Firestore document ID from query params

    if (!id) {
      return errorResponse('Pilot ID is required for update', 400);
    }

    const updatedFields = await request.json();

    const pilotDocRef = db.collection('pilots').doc(id);
    await pilotDocRef.update(updatedFields);

    const updatedPilotDoc = await pilotDocRef.get();
    if (updatedPilotDoc.exists) {
      return successResponse({ id: updatedPilotDoc.id, ...updatedPilotDoc.data() });
    }
    return errorResponse('Pilot not found', 404);
  } catch (error) {
    return handleApiError(error);
  }
};

// DELETE /api/pilots/[id] (assuming delete by Firestore document ID)
const handleDeletePilot = async (request) => {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id'); // Get Firestore document ID from query params

    if (!id) {
      return errorResponse('Pilot ID is required for deletion', 400);
    }

    const pilotDoc = await db.collection('pilots').doc(id).get();
    if (!pilotDoc.exists) {
      return errorResponse('Pilot not found', 404);
    }

    const pilotData = pilotDoc.data();
    const userId = pilotData.userId;

    // Delete pilot document from Firestore
    await db.collection('pilots').doc(id).delete();

    // Update the corresponding user document to remove the pilotId link
    if (userId) {
      await db.collection('users').doc(userId).update({
        pilotId: null,
      });
    }

    return new NextResponse(null, { status: 204 }); // 204 No Content for successful deletion
  } catch (error) {
    return handleApiError(error);
  }
};

// Export wrapped handlers with RBAC
export const GET = withAuth(handleGetPilots, ['Administrator', 'Pilot', 'Viewer']); // All authenticated users can view
export const POST = withAuth(handlePostPilot, ['Administrator']); // Only admins can create
export const PUT = withAuth(handlePutPilot, ['Administrator']); // Only admins can update (Pilot self-update will be handled by specific route if needed)
export const DELETE = withAuth(handleDeletePilot, ['Administrator']); // Only admins can delete
