<?xml version="1.0" encoding="UTF-8"?>
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verify, JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import mongoose from 'mongoose'; // Needed for potential ObjectId checks if required later
import connectDB from '@/lib/db';
import GoalModel from '@/models/Goal';
import type {
  Goal,
  CreateGoalPayload,
  ApiResponse,
  JwtPayload,
} from '@/lib/types';

// Zod schema for validating the POST request body based on CreateGoalPayload
// Ensure dates passed as strings are valid ISO 8601 date strings
const createGoalSchema = z.object({
  name: z.string().trim().min(1, 'Goal name is required.'),
  description: z.string().trim().optional(),
  targetMetric: z.string().trim().optional(),
  targetUnit: z.string().trim().optional(),
  deadline: z
    .string()
    .datetime({ offset: true, message: 'Invalid deadline date format.' }) // Validate ISO 8601 format
    .optional()
    .or(z.date().optional()), // Allow Date objects too, though JSON typically sends strings
});

// Helper function to verify JWT and extract userId
// Note: This duplicates verification logic present in middleware, as required by the prompt.
// In a real-world scenario without this specific prompt constraint, relying solely on
// middleware verification and potentially using lib/auth.ts's decoding might be preferred.
async function getVerifiedUserId(
  request: NextRequest
): Promise<string | NextResponse<ApiResponse<never>>> {
  const token = request.cookies.get('access_token')?.value;

  if (!token) {
    console.warn('[API Goals] Authentication token missing.');
    return NextResponse.json<ApiResponse<never>>(
      { success: false, message: 'Authentication required.' },
      { status: 401 }
    );
  }

  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    console.error('[API Goals] JWT_SECRET environment variable is not defined.');
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
      return payload.userId; // Successfully verified and extracted userId
    } else {
      console.error(
        '[API Goals] Invalid JWT payload structure after verification:',
        decoded
      );
      return NextResponse.json<ApiResponse<never>>(
        { success: false, message: 'Invalid token payload.' },
        { status: 401 }
      );
    }
  } catch (error: any) {
    console.error('[API Goals] JWT Verification Error:', error.message);
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

/**
 * POST handler for /api/goals
 * Creates a new fitness goal for the authenticated user.
 * @param request - The incoming NextRequest object.
 * @returns A NextResponse object with the API response.
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<{ goal: Goal } | any>>> {
  // 1. Ensure database connection
  try {
    await connectDB();
  } catch (dbError) {
    console.error('[API Goals POST] Database Connection Error:', dbError);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: 'Internal Server Error: Could not connect to database.',
      },
      { status: 500 }
    );
  }

  // 2. Verify JWT and get userId
  const userIdOrResponse = await getVerifiedUserId(request);
  if (userIdOrResponse instanceof NextResponse) {
    return userIdOrResponse; // Return error response if auth failed
  }
  const userId = userIdOrResponse; // userId is string here

  let rawBody: any;
  try {
    // 3. Parse request body
    rawBody = await request.json();
  } catch (parseError) {
    console.error('[API Goals POST] Request Body Parsing Error:', parseError);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: 'Invalid request body: Could not parse JSON.',
      },
      { status: 400 }
    );
  }

  // 4. Validate request body using Zod schema
  const validationResult = createGoalSchema.safeParse(rawBody);
  if (!validationResult.success) {
    console.log('[API Goals POST] Validation Error:', validationResult.error.flatten());
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: 'Invalid goal data provided.',
        error: 'Validation failed', // General validation error message
        // Optionally include flattened errors:
        // validationErrors: validationResult.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  // 5. Create the goal in the database
  try {
    const goalData: CreateGoalPayload & { userId: string } = {
      ...validationResult.data,
      userId: userId, // Add the verified userId
      // Convert deadline string back to Date object if necessary for Mongoose
      ...(validationResult.data.deadline && {
        deadline: new Date(validationResult.data.deadline),
      }),
    };

    const newGoalDoc = await GoalModel.create(goalData);

    // Convert Mongoose document to plain object matching the Goal type
    // Ensure _id and userId are strings as expected by the Goal type
    const newGoal: Goal = {
      _id: newGoalDoc._id.toString(),
      userId: newGoalDoc.userId.toString(),
      name: newGoalDoc.name,
      description: newGoalDoc.description,
      targetMetric: newGoalDoc.targetMetric,
      targetUnit: newGoalDoc.targetUnit,
      deadline: newGoalDoc.deadline, // Mongoose timestamps are Date objects
      createdAt: newGoalDoc.createdAt,
      updatedAt: newGoalDoc.updatedAt,
    };

    console.log(`[API Goals POST] Goal created successfully for user ${userId}`);
    return NextResponse.json<ApiResponse<{ goal: Goal }>>(
      { success: true, data: { goal: newGoal } },
      { status: 201 } // Created
    );
  } catch (error: any) {
    console.error('[API Goals POST] Database Error creating goal:', error);
    // Handle potential Mongoose validation errors or other DB issues
    if (error.name === 'ValidationError') {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: 'Database validation failed.',
          error: error.message,
        },
        { status: 400 }
      );
    }
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: 'Internal Server Error: Could not create goal.',
      },
      { status: 500 }
    );
  }
}

/**
 * GET handler for /api/goals
 * Retrieves all fitness goals for the authenticated user.
 * @param request - The incoming NextRequest object.
 * @returns A NextResponse object with the API response.
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<{ goals: Goal[] } | any>>> {
  // 1. Ensure database connection
  try {
    await connectDB();
  } catch (dbError) {
    console.error('[API Goals GET] Database Connection Error:', dbError);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: 'Internal Server Error: Could not connect to database.',
      },
      { status: 500 }
    );
  }

  // 2. Verify JWT and get userId
  const userIdOrResponse = await getVerifiedUserId(request);
  if (userIdOrResponse instanceof NextResponse) {
    return userIdOrResponse; // Return error response if auth failed
  }
  const userId = userIdOrResponse;

  // 3. Fetch goals from the database
  try {
    // Find goals matching the verified userId, sort by creation date descending
    // Use .lean() to get plain JavaScript objects directly, which match the Goal type
    const goals = await GoalModel.find({ userId: userId })
      .sort({ createdAt: -1 })
      .lean<Goal[]>() // Type assertion with lean()
      .exec();

    // Ensure _id and userId are strings in the response if needed (lean might handle this, but double-check)
    // .lean() typically returns BSON types as JS types, so ObjectIDs become strings when serialized.
    // Manual mapping is usually not needed with .lean() for this purpose.

    console.log(`[API Goals GET] Fetched ${goals.length} goals for user ${userId}`);
    return NextResponse.json<ApiResponse<{ goals: Goal[] }>>(
      { success: true, data: { goals } },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[API Goals GET] Database Error fetching goals:', error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: 'Internal Server Error: Could not retrieve goals.',
      },
      { status: 500 }
    );
  }
}