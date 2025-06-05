import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/authMiddleware';
import { successResponse, errorResponse, handleApiError } from '@/lib/apiResponse';
import { db } from '@/lib/firebaseAdmin'; // Import Firestore db

/**
 * @openapi
 * components:
 *   schemas:
 *     Mission:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: The Firestore document ID of the mission.
 *           readOnly: true
 *         name:
 *           type: string
 *           description: The name or title of the mission.
 *         client:
 *           type: string
 *           description: The client for whom the mission is being performed.
 *         location:
 *           type: string
 *           description: The geographical location of the mission.
 *         pilotId:
 *           type: string
 *           description: The ID of the pilot assigned to the mission.
 *         droneId:
 *           type: string
 *           description: The ID of the drone assigned to the mission.
 *         date:
 *           type: string
 *           format: date
 *           description: The scheduled date of the mission.
 *         status:
 *           type: string
 *           enum: [Scheduled, In Progress, Completed, Cancelled]
 *           description: The current status of the mission.
 *       required:
 *         - name
 *         - client
 *         - location
 *         - pilotId
 *         - droneId
 *         - date
 *         - status
 *
 * tags:
 *   - name: Missions
 *     description: Mission planning and tracking operations
 *
 * /api/missions:
 *   get:
 *     summary: Retrieve a list of missions or a single mission by ID.
 *     description: Fetches all missions (Admin only) or missions assigned to the requesting pilot.
 *     tags:
 *       - Missions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: string
 *         description: Optional. The Firestore document ID of the mission to retrieve.
 *     responses:
 *       200:
 *         description: A list of missions or a single mission object.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Mission'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *   post:
 *     summary: Create a new mission.
 *     description: Creates a new mission record. Only Administrators can create missions.
 *     tags:
 *       - Missions
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Mission'
 *     responses:
 *       201:
 *         description: Mission created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Mission'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 * /api/missions/{id}:
 *   put:
 *     summary: Update an existing mission.
 *     description: Updates a mission's details. Only Administrators can update missions.
 *     tags:
 *       - Missions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The Firestore document ID of the mission to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Mission'
 *     responses:
 *       200:
 *         description: Mission updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Mission'
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
 *     summary: Delete a mission.
 *     description: Deletes a mission record. Only Administrators can delete missions.
 *     tags:
 *       - Missions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The Firestore document ID of the mission to delete.
 *     responses:
 *       204:
 *         description: Mission deleted successfully.
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

// GET /api/missions
const handleGetMissions = async (request) => {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const requestingUser = request.user;

  try {
    if (id) {
      const missionDoc = await db.collection('missions').doc(id).get();
      if (missionDoc.exists) {
        const missionData = { id: missionDoc.id, ...missionDoc.data() };
        // Pilots can only view their assigned missions
        if (requestingUser.role === 'Pilot' && requestingUser.pilotId !== missionData.pilotId) {
          return errorResponse('Forbidden: You can only view your own assigned missions', 403);
        }
        return successResponse(missionData);
      }
      return errorResponse('Mission not found', 404);
    }

    let query = db.collection('missions');

    // Pilots can only see their own assigned missions
    if (requestingUser.role === 'Pilot') {
      query = query.where('pilotId', '==', requestingUser.pilotId);
    }

    const missionsSnapshot = await query.get();
    const missions = missionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return successResponse(missions);
  } catch (error) {
    return handleApiError(error);
  }
};

// POST /api/missions
const handlePostMission = async (request) => {
  try {
    const newMissionData = await request.json();
    const newMissionRef = await db.collection('missions').add(newMissionData);
    return successResponse({ id: newMissionRef.id, ...newMissionData }, 201);
  } catch (error) {
    return handleApiError(error);
  }
};

// PUT /api/missions
const handlePutMission = async (request) => {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return errorResponse('Mission ID is required', 400);
  }

  try {
    const updatedFields = await request.json();
    const missionRef = db.collection('missions').doc(id);
    const missionDoc = await missionRef.get();
    const requestingUser = request.user; // Get requesting user from authMiddleware

    if (!missionDoc.exists) {
      return errorResponse('Mission not found', 404);
    }

    const missionData = { id: missionDoc.id, ...missionDoc.data() };

    // Pilots can only update their own assigned missions
    if (requestingUser.role === 'Pilot' && requestingUser.pilotId !== missionData.pilotId) {
      return errorResponse('Forbidden: You can only update your own assigned missions', 403);
    }

    await missionRef.update(updatedFields);

    const updatedMissionDoc = await missionRef.get();
    if (updatedMissionDoc.exists) {
      return successResponse({ id: updatedMissionDoc.id, ...updatedMissionDoc.data() });
    }
    return errorResponse('Mission not found', 404); // Should not happen if update was successful
  } catch (error) {
    return handleApiError(error);
  }
};

// DELETE /api/missions
const handleDeleteMission = async (request) => {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const requestingUser = request.user; // Get requesting user from authMiddleware

  if (!id) {
    return errorResponse('Mission ID is required', 400);
  }

  try {
    const missionRef = db.collection('missions').doc(id);
    const missionDoc = await missionRef.get();

    if (!missionDoc.exists) {
      return errorResponse('Mission not found', 404);
    }

    // Only Admins can delete missions
    if (requestingUser.role !== 'Administrator') {
      return errorResponse('Forbidden: Only administrators can delete missions', 403);
    }

    await missionRef.delete();
    return new NextResponse(null, { status: 204 }); // 204 No Content for successful deletion
  } catch (error) {
    return handleApiError(error);
  }
};

// Export wrapped handlers with RBAC
export const GET = withAuth(handleGetMissions, ['Administrator', 'Pilot', 'Viewer']); // All authenticated users can view
export const POST = withAuth(handlePostMission, ['Administrator']); // Only admins can create
export const PUT = withAuth(handlePutMission, ['Administrator', 'Pilot']); // Admins can update any, pilots can update their own
export const DELETE = withAuth(handleDeleteMission, ['Administrator']); // Only admins can delete
