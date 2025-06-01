import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import * as yup from 'yup'; // Import yup
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { withAuth } from '@/lib/authMiddleware';
import { successResponse, errorResponse, handleApiError } from '@/lib/apiResponse'; // Import API response helpers

// Define validation schema for user creation/update
const userSchema = yup.object().shape({
  username: yup.string().min(3).max(50).required(),
  password: yup.string().min(6).required(),
  role: yup.string().oneOf(['Administrator', 'Pilot', 'Viewer']).required(),
  email: yup.string().email().required(),
  pilotId: yup.string().nullable(), // Assuming pilotId is an ObjectId string or null
});

// GET /api/users
const handleGetUsers = async (request) => {
  await dbConnect();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const username = searchParams.get('username');

  try {
    if (id) {
      const user = await User.findById(id);
      if (user) {
        return successResponse(user);
      }
      return errorResponse('User not found', 404);
    }

    if (username) {
      const user = await User.findOne({ username });
      if (user) {
        return successResponse(user);
      }
      return errorResponse('User not found', 404);
    }

    const users = await User.find({});
    return successResponse(users);
  } catch (error) {
    return handleApiError(error);
  }
};

// POST /api/users
const handlePostUser = async (request) => {
  await dbConnect();
  try {
    const newUser = await request.json();
    
    // Validate input
    await userSchema.validate(newUser, { abortEarly: false });

    const hashedPassword = await bcrypt.hash(newUser.password, 10);
    newUser.password = hashedPassword;

    const createdUser = await User.create(newUser);
    return successResponse(createdUser, 201);
  } catch (error) {
    // Yup validation errors will be caught here and handled by handleApiError
    return handleApiError(error);
  }
};

// PUT /api/users
const handlePutUser = async (request) => {
  await dbConnect();
  try {
    const { id, password, ...updatedFields } = await request.json();

    // Validate input (only fields that are part of the schema and are being updated)
    // For PUT, we validate partial data, so use .partial()
    await userSchema.partial().validate(updatedFields, { abortEarly: false });

    if (password) {
      updatedFields.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await User.findByIdAndUpdate(id, updatedFields, { new: true, runValidators: true });
    if (updatedUser) {
      return successResponse(updatedUser);
    }
    return errorResponse('User not found', 404);
  } catch (error) {
    return handleApiError(error);
  }
};

// DELETE /api/users
const handleDeleteUser = async (request) => {
  await dbConnect();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return errorResponse('User ID is required', 400);
  }

  try {
    const deletedUser = await User.findByIdAndDelete(id);
    if (deletedUser) {
      return new NextResponse(null, { status: 204 }); // 204 No Content for successful deletion
    }
    return errorResponse('User not found', 404);
  } catch (error) {
    return handleApiError(error);
  }
};

// Export wrapped handlers with RBAC
export const GET = withAuth(handleGetUsers, ['Administrator']);
export const POST = withAuth(handlePostUser, ['Administrator']);
export const PUT = withAuth(handlePutUser, ['Administrator']);
export const DELETE = withAuth(handleDeleteUser, ['Administrator']);
