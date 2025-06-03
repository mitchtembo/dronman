import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/authMiddleware';
import { successResponse, errorResponse, handleApiError } from '@/lib/apiResponse';
import { db } from '@/lib/firebaseAdmin'; // Import Firestore db

/**
 * @openapi
 * components:
 *   schemas:
 *     Drone:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: The Firestore document ID of the drone.
 *           readOnly: true
 *         model:
 *           type: string
 *           description: The model name of the drone.
 *         serial:
 *           type: string
 *           description: The serial number of the drone.
 *         make:
 *           type: string
 *           description: The manufacturer of the drone.
 *         purchaseDate:
 *           type: string
 *           format: date
 *           description: The date the drone was purchased.
 *         status:
 *           type: string
 *           enum: [Available, In Use, Under Maintenance, Retired]
 *           description: The current operational status of the drone.
 *         lastMaintenance:
 *           type: string
 *           format: date
 *           description: The date of the last maintenance.
 *         nextServiceDate:
 *           type: string
 *           format: date
 *           description: The date of the next scheduled service.
 *       required:
 *         - model
 *         - serial
 *         - make
 *         - status
 *
 * tags:
 *   - name: Drones
 *     description: Drone management operations
 *
 * /api/drones:
 *   get:
 *     summary: Retrieve a list of drones or a single drone by ID.
 *     description: Fetches all drones.
 *     tags:
 *       - Drones
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: string
 *         description: Optional. The Firestore document ID of the drone to retrieve.
 *     responses:
 *       200:
 *         description: A list of drones or a single drone object.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Drone'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *   post:
 *     summary: Create a new drone.
 *     description: Creates a new drone record. Only Administrators can create drones.
 *     tags:
 *       - Drones
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Drone'
 *     responses:
 *       201:
 *         description: Drone created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Drone'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 * /api/drones/{id}:
 *   put:
 *     summary: Update an existing drone.
 *     description: Updates a drone's details. Only Administrators can update drones.
 *     tags:
 *       - Drones
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The Firestore document ID of the drone to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Drone'
 *     responses:
 *       200:
 *         description: Drone updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Drone'
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
 *     summary: Delete a drone.
 *     description: Deletes a drone record. Only Administrators can delete drones.
 *     tags:
 *       - Drones
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The Firestore document ID of the drone to delete.
 *     responses:
 *       204:
 *         description: Drone deleted successfully.
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

// GET /api/drones
const handleGetDrones = async (request) => {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  try {
    if (id) {
      const droneDoc = await db.collection('drones').doc(id).get();
      if (droneDoc.exists) {
        return successResponse({ id: droneDoc.id, ...droneDoc.data() });
      }
      return errorResponse('Drone not found', 404);
    }

    const dronesSnapshot = await db.collection('drones').get();
    const drones = dronesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return successResponse(drones);
  } catch (error) {
    return handleApiError(error);
  }
};

// POST /api/drones
const handlePostDrone = async (request) => {
  try {
    const newDroneData = await request.json();
    const newDroneRef = await db.collection('drones').add(newDroneData);
    return successResponse({ id: newDroneRef.id, ...newDroneData }, 201);
  } catch (error) {
    return handleApiError(error);
  }
};

// PUT /api/drones
const handlePutDrone = async (request) => {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return errorResponse('Drone ID is required', 400);
  }

  try {
    const updatedFields = await request.json();
    const droneRef = db.collection('drones').doc(id);
    await droneRef.update(updatedFields);

    const updatedDroneDoc = await droneRef.get();
    if (updatedDroneDoc.exists) {
      return successResponse({ id: updatedDroneDoc.id, ...updatedDroneDoc.data() });
    }
    return errorResponse('Drone not found', 404);
  } catch (error) {
    return handleApiError(error);
  }
};

// DELETE /api/drones
const handleDeleteDrone = async (request) => {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return errorResponse('Drone ID is required', 400);
  }

  try {
    const droneRef = db.collection('drones').doc(id);
    const droneDoc = await droneRef.get();

    if (!droneDoc.exists) {
      return errorResponse('Drone not found', 404);
    }

    await droneRef.delete();
    return new NextResponse(null, { status: 204 }); // 204 No Content for successful deletion
  } catch (error) {
    return handleApiError(error);
  }
};

// Export wrapped handlers with RBAC
export const GET = withAuth(handleGetDrones, ['Administrator', 'Pilot', 'Viewer']); // All authenticated users can view
export const POST = withAuth(handlePostDrone, ['Administrator']); // Only admins can create
export const PUT = withAuth(handlePutDrone, ['Administrator']); // Only admins can update
export const DELETE = withAuth(handleDeleteDrone, ['Administrator']); // Only admins can delete
