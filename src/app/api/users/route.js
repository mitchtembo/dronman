import { NextResponse } from 'next/server';
import * as yup from 'yup';
import { db, auth } from '@/lib/firebaseAdmin';
import { withAuth } from '@/lib/authMiddleware';
import { successResponse, errorResponse, handleApiError } from '@/lib/apiResponse';
import { ROLES } from '@/lib/auth'; // Import ROLES

/**
 * @openapi
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         uid:
 *           type: string
 *           description: The Firebase Auth UID of the user.
 *           readOnly: true
 *         email:
 *           type: string
 *           format: email
 *           description: The email address of the user.
 *         role:
 *           type: string
 *           enum: [Administrator, Pilot, Viewer]
 *           description: The role of the user.
 *         pilotId:
 *           type: string
 *           nullable: true
 *           description: The ID of the pilot associated with this user, if applicable.
 *       required:
 *         - email
 *         - role
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *
 * tags:
 *   - name: Users
 *     description: User management and authentication
 *
 * /api/users:
 *   get:
 *     summary: Retrieve a list of users or a single user by UID/email.
 *     description: Fetches all users (Admin only) or a specific user by UID or email.
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: uid
 *         schema:
 *           type: string
 *         description: Optional. The Firebase Auth UID of the user to retrieve.
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *           format: email
 *         description: Optional. The email of the user to retrieve.
 *     responses:
 *       200:
 *         description: A list of users or a single user object.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *   post:
 *     summary: Create a new user.
 *     description: Creates a new user in Firebase Authentication and Firestore. Only Administrators can create users.
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: The email for the new user.
 *               password:
 *                 type: string
 *                 minItems: 6
 *                 description: The password for the new user (minimum 6 characters).
 *               role:
 *                 type: string
 *                 enum: [Administrator, Pilot, Viewer]
 *                 description: The role of the new user.
 *               pilotId:
 *                 type: string
 *                 nullable: true
 *                 description: Optional. The ID of the pilot to associate with this user.
 *             required:
 *               - email
 *               - password
 *               - role
 *     responses:
 *       201:
 *         description: User created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 * /api/users/{uid}:
 *   put:
 *     summary: Update an existing user.
 *     description: Updates a user's details in Firestore and optionally Firebase Auth. Only Administrators can update users.
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uid
 *         schema:
 *           type: string
 *         required: true
 *         description: The Firebase Auth UID of the user to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: New email for the user.
 *               role:
 *                 type: string
 *                 enum: [Administrator, Pilot, Viewer]
 *                 description: New role for the user.
 *               pilotId:
 *                 type: string
 *                 nullable: true
 *                 description: New pilot ID to associate with the user.
 *     responses:
 *       200:
 *         description: User updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
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
 *     summary: Delete a user.
 *     description: Deletes a user from Firebase Authentication and Firestore. Only Administrators can delete users.
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uid
 *         schema:
 *           type: string
 *         required: true
 *         description: The Firebase Auth UID of the user to delete.
 *     responses:
 *       204:
 *         description: User deleted successfully.
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

// Define validation schema for user creation/update
const userSchema = yup.object().shape({
  email: yup.string().email().required(),
  password: yup.string().min(6).required(), // Password is required for creation via Firebase Auth
  role: yup.string().oneOf(['Administrator', 'Pilot', 'Viewer']).required(),
  pilotId: yup.string().nullable(),
});

// Schema for partial updates (PUT)
const userUpdateSchema = yup.object().shape({
  email: yup.string().email().optional(),
  role: yup.string().oneOf(['Administrator', 'Pilot', 'Viewer']).optional(),
  pilotId: yup.string().nullable().optional(),
});

// GET /api/users
const handleGetUsers = async (request) => {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid'); // Use uid for Firestore document ID
    const email = searchParams.get('email'); // Search by email if needed

    if (uid) {
      const userDoc = await db.collection('users').doc(uid).get();
      if (userDoc.exists) {
        return successResponse({ id: userDoc.id, ...userDoc.data() });
      }
      return errorResponse('User not found', 404);
    }

    if (email) {
      const usersSnapshot = await db.collection('users').where('email', '==', email).limit(1).get();
      if (!usersSnapshot.empty) {
        const userDoc = usersSnapshot.docs[0];
        return successResponse({ id: userDoc.id, ...userDoc.data() });
      }
      return errorResponse('User not found', 404);
    }

    const usersSnapshot = await db.collection('users').get();
    const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return successResponse(users);
  } catch (error) {
    return handleApiError(error);
  }
};

// POST /api/users
const handlePostUser = async (request) => {
  try {
    const newUser = await request.json();
    
    // Validate input for creation
    await userSchema.validate(newUser, { abortEarly: false });

    // Create user in Firebase Authentication
    const userRecord = await auth.createUser({
      email: newUser.email,
      password: newUser.password,
      // displayName: newUser.username, // If you want to set display name
    });

    // Create user document in Firestore
    const userDocRef = db.collection('users').doc(userRecord.uid);
    let pilotId = newUser.pilotId || null;

    // If the new user is a Pilot, create a corresponding entry in the 'pilots' collection
    if (newUser.role === ROLES.PILOT) {
      const pilotName = newUser.email.split('@')[0]; // Simple name derivation from email
      const newPilotRef = await db.collection('pilots').add({
        userId: userRecord.uid,
        name: pilotName,
        email: newUser.email,
        contact: newUser.contact || null, // Assuming contact might be part of pilot creation
        status: 'Active', // Default status for new pilots
        certifications: [], // New pilots start with no certifications
      });
      pilotId = newPilotRef.id; // Set the pilotId to the newly created pilot document ID
    }

    await userDocRef.set({
      uid: userRecord.uid,
      email: newUser.email,
      role: newUser.role,
      pilotId: pilotId, // Link the user to the pilot document
    });

    return successResponse({ id: userRecord.uid, email: newUser.email, role: newUser.role, pilotId: pilotId }, 201);
  } catch (error) {
    // Handle Firebase Auth errors (e.g., email-already-in-use)
    if (error.code && error.code.startsWith('auth/')) {
      return errorResponse(error.message, 400); // Bad request for auth errors
    }
    return handleApiError(error);
  }
};

// PUT /api/users/[uid] (assuming update by UID)
const handlePutUser = async (request) => {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid'); // Get UID from query params for update

    if (!uid) {
      return errorResponse('User UID is required for update', 400);
    }

    const updatedFields = await request.json();

    // Validate input for partial update
    await userUpdateSchema.validate(updatedFields, { abortEarly: false });

    // Update user document in Firestore
    const userDocRef = db.collection('users').doc(uid);
    await userDocRef.update(updatedFields);

    // Optionally update Firebase Auth user properties (e.g., email)
    if (updatedFields.email) {
      await auth.updateUser(uid, { email: updatedFields.email });
    }

    const updatedUserDoc = await userDocRef.get();
    if (updatedUserDoc.exists) {
      return successResponse({ id: updatedUserDoc.id, ...updatedUserDoc.data() });
    }
    return errorResponse('User not found', 404);
  } catch (error) {
    // Handle Firebase Auth errors (e.g., email-already-exists)
    if (error.code && error.code.startsWith('auth/')) {
      return errorResponse(error.message, 400);
    }
    return handleApiError(error);
  }
};

// DELETE /api/users/[uid] (assuming delete by UID)
const handleDeleteUser = async (request) => {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid'); // Get UID from query params for delete

    if (!uid) {
      return errorResponse('User UID is required for deletion', 400);
    }

    // Delete user from Firebase Authentication
    await auth.deleteUser(uid);

    // Delete user document from Firestore
    await db.collection('users').doc(uid).delete();

    return new NextResponse(null, { status: 204 }); // 204 No Content for successful deletion
  } catch (error) {
    // Handle Firebase Auth errors (e.g., user-not-found)
    if (error.code && error.code.startsWith('auth/')) {
      return errorResponse(error.message, 400);
    }
    return handleApiError(error);
  }
};

// Export wrapped handlers with RBAC
export const GET = withAuth(handleGetUsers, ['Administrator']);
export const POST = withAuth(handlePostUser, ['Administrator']);
export const PUT = withAuth(handlePutUser, ['Administrator']);
export const DELETE = withAuth(handleDeleteUser, ['Administrator']);
