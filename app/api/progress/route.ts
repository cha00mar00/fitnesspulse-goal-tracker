<?xml version="1.0" encoding="UTF-8"?>
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verify, JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import mongoose from 'mongoose'; // Specifically for Types.ObjectId.isValid
import connectDB from '@/lib/db';
import GoalModel from '@/models/Goal';
import ProgressModel from '@/models/Progress';
import type {
  ProgressEntry,
  LogProgressPayload,
  ApiResponse,
  JwtPayload,
  LogProgressResponse,
} from '@/lib/types';

// Internal Helper Function (`getVerifiedUserId`) - Exact copy from context
async function getVerifiedUserId(
  request: NextRequest
): Promise<string | NextResponse<ApiResponse<never>>> {
  const token = request.cookies.get('access_token')?.value;

  if (!token) {
    console.warn('[API Progress] Authentication token missing.');
    return NextResponse.json<ApiResponse<never>>(
      { success: false, message: 'Authentication required.' },
      { status: 401 }
    );
  }

  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    console.error('[API Progress] JWT_SECRET environment variable is not defined.');
    return NextResponse.json<ApiResponse<never>>(
      {
        success: false,
        message: 'Internal Server Error: Server configuration missing.',
      },
      { status: 500 }
    );
  }

  try {
    const decoded = verify(token, jwtSecret);

    // Validate the structure of the decoded payload
    if (
      typeof decoded === 'object' &&
      decoded !== null &&
      'userId' in decoded &&
      typeof (decoded as any).userId === 'string'
    ) {
      const payload = decoded as JwtPayload;
      // Additional check for non-empty userId string
      if (payload.userId.length > 0) {
        return payload.userId; // Successfully verified and extracted userId
      }
      console.error(
        '[API Progress] Invalid JWT payload: userId is an empty string.'
      );
      return NextResponse.json<ApiResponse<never>>(
        { success: false, message: 'Invalid token payload.' },
        { status: 401 }
      );
    } else {
      console.error(
        '[API Progress] Invalid JWT payload structure after verification:',
        decoded
      );
      return NextResponse.json<ApiResponse<never>>(
        { success: false, message: 'Invalid token payload.' },
        { status: 401 }
      );
    }
  } catch (error: any) {
    console.error('[API Progress] JWT Verification Error:', error.message);
    let message = 'Invalid or expired token.';
    if (error instanceof TokenExpiredError) {
      message = 'Token expired.';
    } else if (error instanceof JsonWebTokenError) {
      message = 'Invalid token.';
    }
    return NextResponse.json<ApiResponse<never>>(
      { success: false, message: message },
      { status: 401 }
    );
  }
}

// Zod Validation Schema (`logProgressSchema`)
const logProgressSchema = z
  .object({
    goalId: z
      .string()
      .refine(
        (value) => mongoose.Types.ObjectId.isValid(value),
        { message: 'Invalid Goal ID format.' }
      ),
    value: z.number().finite('Progress value must be a finite number.'),
    date: z
      .string()
      .datetime({
        offset: true,
        message: 'Invalid date format. Please use ISO 8601 format.',
      }),
    notes: z.string().trim().optional(),
  })
  .strict(); // Disallow extra fields

/**
 * POST handler for /api/progress
 * Creates a new progress entry for an authenticated user against a goal they own.
 * @param request - The incoming NextRequest object.
 * @returns A NextResponse object with the API response.
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<LogProgressResponse | ApiResponse<any>>> {
  // 1. Database Connection
  try {
    await connectDB();
  } catch (dbError) {
    console.error('[API Progress POST] Database Connection Error:', dbError);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: 'Internal Server Error: Could not connect to database.',
      },
      { status: 500 }
    );
  }

  // 2. Authentication & Authorization (User ID)
  const userIdOrResponse = await getVerifiedUserId(request);
  if (userIdOrResponse instanceof NextResponse) {
    return userIdOrResponse; // Return error response if auth failed
  }
  const userId = userIdOrResponse; // userId is guaranteed to be a string here

  let rawBody: any;
  try {
    // 3. Request Body Parsing
    rawBody = await request.json();
  } catch (parseError) {
    console.error('[API Progress POST] Request Body Parsing Error:', parseError);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: 'Invalid request body: Could not parse JSON.',
      },
      { status: 400 }
    );
  }

  // 4. Input Validation
  const validationResult = logProgressSchema.safeParse(rawBody);
  if (!validationResult.success) {
    console.log(
      '[API Progress POST] Validation Error:',
      validationResult.error.flatten()
    );
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: 'Invalid progress data provided.',
        error: 'Validation failed', // General validation error message
        // Optionally include flattened errors:
        validationErrors: validationResult.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const validatedData = validationResult.data;

  try {
    // 5. Goal Ownership Verification (CRITICAL)
    const goal = await GoalModel.findOne({
      _id: validatedData.goalId,
      userId: userId, // Ensure the goal belongs to the authenticated user
    })
      .lean()
      .exec();

    if (!goal) {
      console.log(
        `[API Progress POST] Goal ownership check failed: Goal not found or permission denied for goalId: ${validatedData.goalId}, userId: ${userId}`
      );
      return NextResponse.json<ApiResponse<never>>(
        {
          success: false,
          message: 'Goal not found or you do not have permission.',
        },
        { status: 404 } // Use 404 for consistency with Goal Detail GET/PUT/DELETE
      );
    }

    // 6. Progress Creation
    const progressData = {
      ...validatedData,
      userId: userId, // Use the verified userId from token
      date: new Date(validatedData.date), // Convert validated ISO string to Date object
    };

    const newProgressDoc = await ProgressModel.create(progressData);

    // 7. Success Response
    // Format the created document to match the ProgressEntry type
    const formattedProgressEntry: ProgressEntry = {
      _id: newProgressDoc._id.toString(),
      goalId: newProgressDoc.goalId.toString(),
      userId: newProgressDoc.userId.toString(),
      value: newProgressDoc.value,
      date: newProgressDoc.date, // Date object is fine for API response (will be serialized)
      notes: newProgressDoc.notes,
      createdAt: newProgressDoc.createdAt,
      updatedAt: newProgressDoc.updatedAt,
    };

    console.log(
      `[API Progress POST] Progress created successfully for goalId: ${validatedData.goalId}, userId: ${userId}`
    );
    return NextResponse.json<LogProgressResponse>(
      { success: true, data: { progressEntry: formattedProgressEntry } },
      { status: 201 } // Created
    );
  } catch (error: any) {
    // Handle potential Mongoose validation errors or other DB issues during creation
    if (error.name === 'ValidationError') {
      console.error('[API Progress POST] Mongoose Validation Error:', error);
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: 'Database validation failed while saving progress.',
          error: error.message,
        },
        { status: 400 }
      );
    }
    // Handle other potential database errors
    console.error('[API Progress POST] Database Error creating progress:', error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: 'Internal Server Error: Could not save progress entry.',
      },
      { status: 500 }
    );
  }
}