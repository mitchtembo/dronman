// src/lib/apiResponse.js
import { NextResponse } from 'next/server';

/**
 * Standardized success response.
 * @param {object} data - The data to return in the response.
 * @param {number} status - HTTP status code (default: 200).
 * @returns {NextResponse}
 */
export function successResponse(data, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

/**
 * Standardized error response.
 * @param {string} message - A user-friendly error message.
 * @param {number} status - HTTP status code (default: 500).
 * @param {object} details - Optional, additional error details (e.g., validation errors).
 * @returns {NextResponse}
 */
export function errorResponse(message, status = 500, details = {}) {
  return NextResponse.json({ success: false, error: message, details }, { status });
}

/**
 * Handles common Mongoose/API errors and returns a standardized error response.
 * @param {Error} error - The error object.
 * @returns {NextResponse}
 */
export function handleApiError(error) {
  if (error.name === 'ValidationError') {
    // Mongoose validation error
    const errors = {};
    for (let field in error.errors) {
      errors[field] = error.errors[field].message;
    }
    return errorResponse('Validation failed', 400, errors);
  } else if (error.name === 'CastError') {
    // Mongoose cast error (e.g., invalid ObjectId)
    return errorResponse(`Invalid ID format for ${error.path}`, 400);
  } else if (error.code === 11000) {
    // MongoDB duplicate key error
    const field = Object.keys(error.keyValue)[0];
    return errorResponse(`Duplicate value for ${field}. Please use another value.`, 409);
  } else if (error.message === 'Authentication required' || error.message === 'Invalid or expired token') {
    return errorResponse(error.message, 401);
  } else if (error.message.startsWith('Forbidden:')) {
    return errorResponse(error.message, 403);
  } else {
    // Generic server error
    console.error("Unhandled API Error:", error);
    return errorResponse('An unexpected error occurred', 500);
  }
}
