import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/authMiddleware';
import { successResponse, errorResponse, handleApiError } from '@/lib/apiResponse';
import { db } from '@/lib/firebaseAdmin'; // Import Firestore db

/**
 * @openapi
 * components:
 *   schemas:
 *     FlightLog:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: The Firestore document ID of the flight log.
 *           readOnly: true
 *         pilotId:
 *           type: string
 *           description: The ID of the pilot who performed the flight.
 *         droneId:
 *           type: string
 *           description: The ID of the drone used for the flight.
 *         date:
 *           type: string
 *           format: date
 *           description: The date of the flight.
 *         duration:
 *           type: number
 *           description: The duration of the flight in minutes.
 *         location:
 *           type: string
 *           description: The location where the flight took place.
 *         missionType:
 *           type: string
 *           description: The type of mission (e.g., "Training", "Survey").
 *         weather:
 *           type: string
 *           description: Weather conditions during the flight.
 *         incidents:
 *           type: string
 *           description: Any incidents or anomalies during the flight.
 *         notes:
 *           type: string
 *           description: Additional notes about the flight.
 *       required:
 *         - pilotId
 *         - droneId
 *         - date
 *         - duration
 *         - location
 *         - missionType
 *
 * tags:
 *   - name: Flight Logs
 *     description: Drone flight log management
 *
 * /api/flights:
 *   get:
 *     summary: Retrieve a list of flight logs or a single flight log by ID.
 *     description: Fetches all flight logs (Admin only) or flight logs for the requesting pilot.
 *     tags:
 *       - Flight Logs
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: string
 *         description: Optional. The Firestore document ID of the flight log to retrieve.
 *     responses:
 *       200:
 *         description: A list of flight logs or a single flight log object.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/FlightLog'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *   post:
 *     summary: Create a new flight log.
 *     description: Creates a new flight log record. Administrators can create any flight log, Pilots can only create their own.
 *     tags:
 *       - Flight Logs
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FlightLog'
 *     responses:
 *       201:
 *         description: Flight log created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FlightLog'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 * /api/flights/{id}:
 *   put:
 *     summary: Update an existing flight log.
 *     description: Updates a flight log record. Administrators can update any flight log, Pilots can only update their own.
 *     tags:
 *       - Flight Logs
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The Firestore document ID of the flight log to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FlightLog'
 *     responses:
 *       200:
 *         description: Flight log updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FlightLog'
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
 *     summary: Delete a flight log.
 *     description: Deletes a flight log record. Only Administrators can delete flight logs.
 *     tags:
 *       - Flight Logs
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The Firestore document ID of the flight log to delete.
 *     responses:
 *       204:
 *         description: Flight log deleted successfully.
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

// GET /api/flights
const handleGetFlightLogs = async (request) => {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const requestingUser = request.user;

  try {
    if (id) {
      const flightLogDoc = await db.collection('flightlogs').doc(id).get();
      if (flightLogDoc.exists) {
        const flightLogData = { id: flightLogDoc.id, ...flightLogDoc.data() };
        // Pilots can only view their own flight logs
        if (requestingUser.role === 'Pilot' && requestingUser.pilotId !== flightLogData.pilotId) {
          return errorResponse('Forbidden: You can only view your own flight logs', 403);
        }
        return successResponse(flightLogData);
      }
      return errorResponse('Flight Log not found', 404);
    }

    let query = db.collection('flightlogs');

    // Pilots can only see their own flight logs
    if (requestingUser.role === 'Pilot') {
      query = query.where('pilotId', '==', requestingUser.pilotId);
    }

    const flightLogsSnapshot = await query.get();
    const flightLogs = flightLogsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return successResponse(flightLogs);
  } catch (error) {
    return handleApiError(error);
  }
};

// POST /api/flights
const handlePostFlightLog = async (request) => {
  const requestingUser = request.user;
  try {
    const newFlightLogData = await request.json();

    // Pilots can only create flight logs for themselves
    if (requestingUser.role === 'Pilot' && newFlightLogData.pilotId !== requestingUser.pilotId) {
      return errorResponse('Forbidden: Pilots can only create flight logs for themselves', 403);
    }

    const newFlightLogRef = await db.collection('flightlogs').add(newFlightLogData);
    return successResponse({ id: newFlightLogRef.id, ...newFlightLogData }, 201);
  } catch (error) {
    return handleApiError(error);
  }
};

// PUT /api/flights
const handlePutFlightLog = async (request) => {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const requestingUser = request.user;

  if (!id) {
    return errorResponse('Flight Log ID is required', 400);
  }

  try {
    const updatedFields = await request.json();
    const flightLogRef = db.collection('flightlogs').doc(id);
    const flightLogDoc = await flightLogRef.get();

    if (!flightLogDoc.exists) {
      return errorResponse('Flight Log not found', 404);
    }

    const flightLogData = { id: flightLogDoc.id, ...flightLogDoc.data() };

    // Pilots can only update their own flight logs
    if (requestingUser.role === 'Pilot' && requestingUser.pilotId !== flightLogData.pilotId) {
      return errorResponse('Forbidden: Pilots can only update their own flight logs', 403);
    }

    await flightLogRef.update(updatedFields);
    const updatedFlightLogDoc = await flightLogRef.get();
    return successResponse({ id: updatedFlightLogDoc.id, ...updatedFlightLogDoc.data() });
  } catch (error) {
    return handleApiError(error);
  }
};

// DELETE /api/flights
const handleDeleteFlightLog = async (request) => {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const requestingUser = request.user; // Get requesting user from middleware

  if (!id) {
    return errorResponse('Flight Log ID is required', 400);
  }

  try {
    const flightLogRef = db.collection('flightlogs').doc(id);
    const flightLogDoc = await flightLogRef.get();

    if (!flightLogDoc.exists) {
      return errorResponse('Flight Log not found', 404);
    }

    const flightLogData = { id: flightLogDoc.id, ...flightLogDoc.data() };

    // Only Admins can delete flight logs
    if (requestingUser.role !== 'Administrator') {
      return errorResponse('Forbidden: Only administrators can delete flight logs', 403);
    }

    await flightLogRef.delete();
    return new NextResponse(null, { status: 204 }); // 204 No Content for successful deletion
  } catch (error) {
    return handleApiError(error);
  }
};

// Export wrapped handlers with RBAC
export const GET = withAuth(handleGetFlightLogs, ['Administrator', 'Pilot', 'Viewer']); // All authenticated users can view
export const POST = withAuth(handlePostFlightLog, ['Administrator', 'Pilot']); // Admins and Pilots can create
export const PUT = withAuth(handlePutFlightLog, ['Administrator', 'Pilot']); // Admins or the pilot who logged it can update
export const DELETE = withAuth(handleDeleteFlightLog, ['Administrator']); // Only admins can delete
