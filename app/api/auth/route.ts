import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sign } from 'jsonwebtoken';
import mongoose from 'mongoose'; // Import mongoose mainly for ObjectId validation if needed
import connectDB from '@/lib/db';
import UserModel, { IUserDocument } from '@/models/User'; // Ensure IUserDocument is exported if needed directly, or rely on model methods
import type { User as UserType, ApiResponse } from '@/lib/types';

// --- Zod Schemas for Validation ---

const signupSchema = z.object({
  action: z.literal('signup'),
  name: z.string().trim().min(1, 'Name is required'),
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

const loginSchema = z.object({
  action: z.literal('login'),
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'), // Min 1 to ensure not empty
});

// Base schema to parse the action first
const actionSchema = z.object({
  action: z.enum(['signup', 'login']),
});

// Combined schema type for type inference
const requestBodySchema = z.union([signupSchema, loginSchema]);

// --- Helper Function ---

/**
 * Parses JWT expiration string (e.g., '1d', '7h') into seconds for cookie maxAge.
 * @param expiresIn - The expiration string (e.g., '1d', '7h', '30m', '60s').
 * @returns The number of seconds, or null if the format is invalid.
 */
function parseJwtExpiresIn(expiresIn: string): number | null {
  const match = expiresIn.trim().match(/^(\d+)([dhms])$/);
  if (!match) return null;
  const value = parseInt(match[1], 10);
  const unit = match[2];
  if (isNaN(value) || value <= 0) return null;

  switch (unit) {
    case 'd':
      return value * 24 * 60 * 60;
    case 'h':
      return value * 60 * 60;
    case 'm':
      return value * 60;
    case 's':
      return value;
    default:
      return null;
  }
}

// --- API Route Handler ---

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<any>>> {
  // 1. Ensure database connection
  try {
    await connectDB();
  } catch (dbError) {
    console.error('[API Auth] Database Connection Error:', dbError);
    return NextResponse.json<ApiResponse>(
      { success: false, message: 'Internal Server Error: Could not connect to database.' },
      { status: 500 }
    );
  }

  let rawBody: any;
  try {
    // 2. Parse request body
    rawBody = await request.json();
  } catch (parseError) {
    console.error('[API Auth] Request Body Parsing Error:', parseError);
    return NextResponse.json<ApiResponse>(
      { success: false, message: 'Invalid request body: Could not parse JSON.' },
      { status: 400 }
    );
  }

  // 3. Validate action field first
  const actionParseResult = actionSchema.safeParse(rawBody);
  if (!actionParseResult.success) {
    console.log('[API Auth] Invalid Action:', actionParseResult.error.flatten());
    return NextResponse.json<ApiResponse>(
      { success: false, message: 'Invalid action specified.' },
      { status: 400 }
    );
  }

  const action = actionParseResult.data.action;

  // 4. Handle based on action
  if (action === 'signup') {
    // --- Signup Logic ---
    const signupParseResult = signupSchema.safeParse(rawBody);

    if (!signupParseResult.success) {
      console.log('[API Auth] Signup Validation Error:', signupParseResult.error.flatten());
      // Return specific validation errors or a generic message
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: 'Invalid signup data.',
          // error: signupParseResult.error.flatten().fieldErrors // Optionally include details
        },
        { status: 400 }
      );
    }

    const { name, email, password } = signupParseResult.data;

    try {
      // Check if user already exists
      const existingUser = await UserModel.findOne({ email: email.toLowerCase() }).lean(); // Use lean for performance if only checking existence
      if (existingUser) {
        console.log(`[API Auth] Signup attempt failed: Email already in use - ${email}`);
        return NextResponse.json<ApiResponse>(
          { success: false, message: 'Email already in use.' },
          { status: 409 } // Conflict
        );
      }

      // Create new user (password hashing handled by pre-save hook in UserModel)
      await UserModel.create({ name, email, password });
      console.log(`[API Auth] Signup successful for email: ${email}`);

      return NextResponse.json<ApiResponse>(
        { success: true, message: 'Signup successful. Please login.' },
        { status: 201 } // Created
      );
    } catch (error: any) {
      console.error('[API Auth] Signup Database Error:', error);
      // Handle potential duplicate key errors during create, though findOne should catch most
      if (error.code === 11000 && error.keyPattern?.email) {
        return NextResponse.json<ApiResponse>(
          { success: false, message: 'Email already in use.' },
          { status: 409 }
        );
      }
      return NextResponse.json<ApiResponse>(
        { success: false, message: 'Internal Server Error: Could not create user.' },
        { status: 500 }
      );
    }
  } else if (action === 'login') {
    // --- Login Logic ---
    const loginParseResult = loginSchema.safeParse(rawBody);

    if (!loginParseResult.success) {
      console.log('[API Auth] Login Validation Error:', loginParseResult.error.flatten());
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: 'Invalid login data.',
          // error: loginParseResult.error.flatten().fieldErrors // Optionally include details
        },
        { status: 400 }
      );
    }

    const { email, password: candidatePassword } = loginParseResult.data;

    try {
      // Find user by email, explicitly selecting password
      const user = await UserModel.findOne({ email: email.toLowerCase() }).select('+password').exec();

      if (!user) {
        console.log(`[API Auth] Login attempt failed: User not found - ${email}`);
        // Generic error message for security (prevents user enumeration)
        return NextResponse.json<ApiResponse>(
          { success: false, message: 'Invalid email or password.' },
          { status: 401 } // Unauthorized
        );
      }

      // Compare passwords using the model's method
      const isPasswordMatch = await user.comparePassword(candidatePassword);

      if (!isPasswordMatch) {
        console.log(`[API Auth] Login attempt failed: Incorrect password - ${email}`);
        // Generic error message
        return NextResponse.json<ApiResponse>(
          { success: false, message: 'Invalid email or password.' },
          { status: 401 } // Unauthorized
        );
      }

      // --- Passwords match: Generate JWT ---
      const jwtSecret = process.env.JWT_SECRET;
      const jwtExpiresIn = process.env.JWT_EXPIRES_IN;

      if (!jwtSecret || !jwtExpiresIn) {
        console.error('[API Auth] JWT configuration missing in environment variables.');
        return NextResponse.json<ApiResponse>(
          { success: false, message: 'Internal Server Error: JWT configuration missing.' },
          { status: 500 }
        );
      }

      const maxAgeSeconds = parseJwtExpiresIn(jwtExpiresIn);
      if (maxAgeSeconds === null) {
        console.error(`[API Auth] Invalid JWT_EXPIRES_IN format: ${jwtExpiresIn}`);
        return NextResponse.json<ApiResponse>(
          { success: false, message: 'Internal Server Error: Invalid JWT expiration format.' },
          { status: 500 }
        );
      }

      try {
        const token = sign(
          { userId: user._id.toString() }, // Use string representation of ObjectId
          jwtSecret,
          { expiresIn: jwtExpiresIn }
        );

        // Prepare user data for response (excluding password)
        // Ensure this matches the UserType interface from lib/types.ts
        const userData: UserType = {
          _id: user._id.toString(),
          name: user.name,
          email: user.email,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        };

        // Create the success response
        const response = NextResponse.json<ApiResponse<{ user: UserType }>>(
          { success: true, data: { user: userData } },
          { status: 200 }
        );

        // Set the HttpOnly cookie
        response.cookies.set('access_token', token, {
          httpOnly: true, // Prevent client-side script access
          secure: process.env.NODE_ENV === 'production', // Send only over HTTPS in production
          sameSite: 'lax', // Recommended for session cookies
          path: '/', // Cookie available across the entire site
          maxAge: maxAgeSeconds, // Cookie lifetime in seconds
        });

        console.log(`[API Auth] Login successful for email: ${email}`);
        return response;

      } catch (jwtError: any) {
        console.error('[API Auth] JWT Signing Error:', jwtError);
        return NextResponse.json<ApiResponse>(
          { success: false, message: 'Internal Server Error: Could not create session.' },
          { status: 500 }
        );
      }

    } catch (error: any) {
      console.error('[API Auth] Login Database/Comparison Error:', error);
      return NextResponse.json<ApiResponse>(
        { success: false, message: 'Internal Server Error during login process.' },
        { status: 500 }
      );
    }
  } else {
    // Should not be reachable due to actionSchema validation, but included for completeness
    return NextResponse.json<ApiResponse>(
      { success: false, message: 'Invalid action specified.' },
      { status: 400 }
    );
  }
}