// src/app/api/auth/login/route.js
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { successResponse, errorResponse, handleApiError } from '@/lib/apiResponse'; // Import API response helpers

export async function POST(request) {
  await dbConnect();

  try {
    const { username, password } = await request.json();

    // Find user by username
    const user = await User.findOne({ username });
    if (!user) {
      return errorResponse('Invalid credentials', 401);
    }

    // Compare provided password with hashed password in DB
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return errorResponse('Invalid credentials', 401);
    }

    // Generate JWT
    const payload = {
      id: user._id,
      username: user.username,
      role: user.role,
      pilotId: user.pilotId, // Include pilotId if available
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '1h', // Token expires in 1 hour
    });

    // Return token (and user info, excluding password)
    return successResponse({
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        pilotId: user.pilotId,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
