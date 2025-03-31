import { NextRequest, NextResponse } from 'next/server';
import { z, ZodError } from 'zod';
import { verify, JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import mongoose from 'mongoose'; // Specifically for Types.ObjectId.isValid
import connectDB from '@/lib/db';
import GoalModel from '@/models/Goal';
import ProgressModel from '@/models/Progress';
import type {
  Goal,
  ProgressEntry,
  UpdateGoalPayload,
  ApiResponse,
  JwtPayload,
  GetGoalDetailResponse,
  UpdateGoalResponse,
  DeleteGoalResponse,
} from '@/lib/types';

// Helper function to verify JWT and extract userId (Exact copy from app/api/goals/route.ts)
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
      // Additional check for non-empty userId string
      if (payload.userId.length > 0) {
        return payload.userId; // Successfully verified and extracted userId
      }
      console.error(
        '[API Goals] Invalid JWT payload: userId is an empty string.'
      );
      return NextResponse.json<ApiResponse<never>>(
        { success: false, message: 'Invalid token payload.' },
        { status: 401 }
      );
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

// Zod schema for validating the PUT request body based on UpdateGoalPayload
const updateGoalSchema = z.object({
  name: z.string().trim().min(1, 'Goal name cannot be empty if provided.').optional(),
  description: z.string().trim().optional(),
  targetMetric: z.string().trim().optional(),
  targetUnit: z.string().trim().optional(),
  deadline: z
    .string()
    .datetime({ offset: true, message: 'Invalid deadline date format.' })
    .optional()
    .or(z.date().optional()), // Allow Date objects too
}).strict(); // Disallow unknown fields

/**
 * GET handler for /api/goals/[goalId]
 * Retrieves details of a specific fitness goal and its progress entries for the authenticated user.
 * @param request - The incoming NextRequest object.
 * @param params - Object containing the dynamic route parameter `goalId`.
 * @returns A NextResponse object with the API response.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { goalId: string } }
): Promise<NextResponse<GetGoalDetailResponse | ApiResponse<any>>> {
  // 1. Validate goalId format
  if (!params.goalId || !mongoose.Types.ObjectId.isValid(params.goalId)) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, message: 'Invalid Goal ID format.' },
      { status: 400 }
    );
  }

  // 2. Ensure database connection
  try {
    await connectDB();
  } catch (dbError) {
    console.error('[API Goal Detail GET] Database Connection Error:', dbError);
    return NextResponse.json<ApiResponse>(\n      {\n        success: false,\n        message: 'Internal Server Error: Could not connect to database.',\n      },\n      { status: 500 }\n    );\n  }\n\n  // 3. Verify JWT and get userId\n  const userIdOrResponse = await getVerifiedUserId(request);\n  if (userIdOrResponse instanceof NextResponse) {\n    return userIdOrResponse; // Return error response if auth failed\n  }\n  const userId = userIdOrResponse;\n\n  // 4. Fetch goal and progress entries\n  try {\n    // Fetch the specific goal, ensuring it belongs to the authenticated user\n    const goal = await GoalModel.findOne({ _id: params.goalId, userId: userId })\n      .lean<Goal>() // Use lean for performance and type compatibility\n      .exec();\n\n    // If goal not found or doesn't belong to the user, return 404\n    if (!goal) {\n      console.log(`[API Goal Detail GET] Goal not found or permission denied for goalId: ${params.goalId}, userId: ${userId}`);\n      return NextResponse.json<ApiResponse<never>>(\n        { success: false, message: 'Goal not found or you do not have permission.' },\n        { status: 404 }\n      );\n    }\n\n    // Fetch associated progress entries, sorted by date descending\n    const progressEntries = await ProgressModel.find({ goalId: params.goalId })\n      .sort({ date: -1 }) // Sort newest first\n      .lean<ProgressEntry[]>()\n      .exec();\n\n    console.log(`[API Goal Detail GET] Successfully fetched goal ${params.goalId} and ${progressEntries.length} progress entries for user ${userId}`);\n    // Return successful response with goal and progress data\n    return NextResponse.json<GetGoalDetailResponse>(\n      { success: true, data: { goal, progressEntries } },\n      { status: 200 }\n    );\n  } catch (error: any) {\n    console.error(`[API Goal Detail GET] Database Error fetching goal ${params.goalId}:`, error);\n    return NextResponse.json<ApiResponse>(\n      {\n        success: false,\n        message: 'Internal Server Error: Could not retrieve goal details.',\n      },\n      { status: 500 }\n    );\n  }\n}\n\n/**\n * PUT handler for /api/goals/[goalId]\n * Updates an existing fitness goal for the authenticated user.\n * @param request - The incoming NextRequest object.\n * @param params - Object containing the dynamic route parameter `goalId`.\n * @returns A NextResponse object with the API response.\n */\nexport async function PUT(\n  request: NextRequest,\n  { params }: { params: { goalId: string } }\n): Promise<NextResponse<UpdateGoalResponse | ApiResponse<any>>> {\n  // 1. Validate goalId format\n  if (!params.goalId || !mongoose.Types.ObjectId.isValid(params.goalId)) {\n    return NextResponse.json<ApiResponse<never>>(\n      { success: false, message: 'Invalid Goal ID format.' },\n      { status: 400 }\n    );\n  }\n\n  // 2. Ensure database connection\n  try {\n    await connectDB();\n  } catch (dbError) {\n    console.error('[API Goal Detail PUT] Database Connection Error:', dbError);\n    return NextResponse.json<ApiResponse>(\n      {\n        success: false,\n        message: 'Internal Server Error: Could not connect to database.',\n      },\n      { status: 500 }\n    );\n  }\n\n  // 3. Verify JWT and get userId\n  const userIdOrResponse = await getVerifiedUserId(request);\n  if (userIdOrResponse instanceof NextResponse) {\n    return userIdOrResponse;\n  }\n  const userId = userIdOrResponse;\n\n  let rawBody: any;\n  try {\n    // 4. Parse request body\n    rawBody = await request.json();\n  } catch (parseError) {\n    console.error('[API Goal Detail PUT] Request Body Parsing Error:', parseError);\n    return NextResponse.json<ApiResponse>(\n      {\n        success: false,\n        message: 'Invalid request body: Could not parse JSON.',\n      },\n      { status: 400 }\n    );\n  }\n\n  // 5. Validate request body using Zod schema\n  const validationResult = updateGoalSchema.safeParse(rawBody);\n  if (!validationResult.success) {\n    console.log('[API Goal Detail PUT] Validation Error:', validationResult.error.flatten());\n    return NextResponse.json<ApiResponse>(\n      {\n        success: false,\n        message: 'Invalid goal update data provided.',\n        error: 'Validation failed',\n        // Include detailed validation errors for debugging/frontend:\n        validationErrors: validationResult.error.flatten().fieldErrors,\n      },\n      { status: 400 }\n    );\n  }\n\n  // 6. Prepare update data (converting deadline if needed)\n  const updateData: Partial<UpdateGoalPayload> = { ...validationResult.data };\n  if (updateData.deadline && typeof updateData.deadline === 'string') {\n    try {\n      updateData.deadline = new Date(updateData.deadline);\n    } catch (dateError) {\n      // This should technically be caught by Zod's datetime validation, but adding safety\n      console.error('[API Goal Detail PUT] Error converting deadline string to Date:', dateError);\n      return NextResponse.json<ApiResponse>(\n        { success: false, message: 'Invalid deadline date format provided.' },\n        { status: 400 }\n      );\n    }\n  }\n  // Remove deadline if it resulted in an invalid date (e.g., from an invalid string not caught by zod somehow)\n  if (updateData.deadline instanceof Date && isNaN(updateData.deadline.getTime())) {\n    delete updateData.deadline;\n  }\n\n  // Check if there's anything to update\n  if (Object.keys(updateData).length === 0) {\n      return NextResponse.json<ApiResponse>(\n        { success: false, message: 'No update data provided.' },\n        { status: 400 }\n      );\n  }\n\n  // 7. Update the goal in the database\n  try {\n    const updatedGoal = await GoalModel.findOneAndUpdate(\n      { _id: params.goalId, userId: userId }, // CRITICAL: Filter by both _id and userId\n      updateData, // The validated and prepared update data\n      {\n        new: true, // Return the updated document\n        runValidators: true, // Run schema validators on update\n      }\n    )\n      .lean<Goal>() // Return plain object\n      .exec();\n\n    // Check if the goal was found and updated\n    if (!updatedGoal) {\n      console.log(`[API Goal Detail PUT] Goal not found or permission denied for update: goalId: ${params.goalId}, userId: ${userId}`);\n      return NextResponse.json<ApiResponse<never>>(\n        { success: false, message: 'Goal not found or you do not have permission.' },\n        { status: 404 }\n      );\n    }\n\n    console.log(`[API Goal Detail PUT] Goal updated successfully: goalId: ${params.goalId}, userId: ${userId}`);\n    // Return the updated goal data\n    return NextResponse.json<UpdateGoalResponse>(\n      { success: true, data: { goal: updatedGoal } },\n      { status: 200 }\n    );\n  } catch (error: any) {\n    console.error(`[API Goal Detail PUT] Database Error updating goal ${params.goalId}:`, error);\n    // Handle potential Mongoose validation errors during update\n    if (error.name === 'ValidationError') {\n      return NextResponse.json<ApiResponse>(\n        {\n          success: false,\n          message: 'Database validation failed during update.',\n          error: error.message,\n          // Optionally extract specific field errors if needed\n        },\n        { status: 400 }\n      );\n    }\n    // Handle other potential database errors\n    return NextResponse.json<ApiResponse>(\n      {\n        success: false,\n        message: 'Internal Server Error: Could not update goal.',\n      },\n      { status: 500 }\n    );\n  }\n}\n\n/**\n * DELETE handler for /api/goals/[goalId]\n * Deletes a specific fitness goal and its associated progress entries for the authenticated user.\n * @param request - The incoming NextRequest object.\n * @param params - Object containing the dynamic route parameter `goalId`.\n * @returns A NextResponse object with the API response (204 No Content on success).\n */\nexport async function DELETE(\n  request: NextRequest,\n  { params }: { params: { goalId: string } }\n): Promise<NextResponse<DeleteGoalResponse | ApiResponse<any>>> {\n  // 1. Validate goalId format\n  if (!params.goalId || !mongoose.Types.ObjectId.isValid(params.goalId)) {\n    return NextResponse.json<ApiResponse<never>>(\n      { success: false, message: 'Invalid Goal ID format.' },\n      { status: 400 }\n    );\n  }\n\n  // 2. Ensure database connection\n  try {\n    await connectDB();\n  } catch (dbError) {\n    console.error('[API Goal Detail DELETE] Database Connection Error:', dbError);\n    return NextResponse.json<ApiResponse>(\n      {\n        success: false,\n        message: 'Internal Server Error: Could not connect to database.',\n      },\n      { status: 500 }\n    );\n  }\n\n  // 3. Verify JWT and get userId\n  const userIdOrResponse = await getVerifiedUserId(request);\n  if (userIdOrResponse instanceof NextResponse) {\n    return userIdOrResponse;\n  }\n  const userId = userIdOrResponse;\n\n  // 4. Delete the goal\n  try {\n    const deleteResult = await GoalModel.deleteOne({\n      _id: params.goalId,\n      userId: userId, // CRITICAL: Ensure deletion only happens if user owns the goal\n    }).exec();\n\n    // Check if a document was actually deleted\n    if (deleteResult.deletedCount === 0) {\n      console.log(`[API Goal Detail DELETE] Goal not found or permission denied for deletion: goalId: ${params.goalId}, userId: ${userId}`);\n      return NextResponse.json<ApiResponse<never>>(\n        { success: false, message: 'Goal not found or you do not have permission.' },\n        { status: 404 }\n      );\n    }\n\n    // Goal deleted successfully\n    console.log(`[API Goal Detail DELETE] Goal deleted successfully: goalId: ${params.goalId}, userId: ${userId}`);\n\n    // 5. Delete associated progress entries (fire-and-forget, but log errors)\n    try {\n      const progressDeleteResult = await ProgressModel.deleteMany({\n        goalId: params.goalId,\n        // No userId check needed here as goalId implies ownership already verified\n      }).exec();\n      console.log(`[API Goal Detail DELETE] Deleted ${progressDeleteResult.deletedCount} associated progress entries for goalId: ${params.goalId}`);\n    } catch (progressError: any) {\n      // Log error but don't fail the overall operation if goal deletion was successful\n      console.error(\n        `[API Goal Detail DELETE] Error deleting progress entries for goalId ${params.goalId}:`,\n        progressError\n      );\n    }\n\n    // 6. Return 204 No Content on successful deletion\n    return new NextResponse(null, { status: 204 });\n\n  } catch (error: any) {\n    console.error(`[API Goal Detail DELETE] Database Error deleting goal ${params.goalId}:`, error);\n    return NextResponse.json<ApiResponse>(\n      {\n        success: false,\n        message: 'Internal Server Error: Could not delete goal.',\n      },\n      { status: 500 }\n    );\n  }\n}\n