import { NextRequest } from 'next/server';
import { decode, JwtPayload } from 'jsonwebtoken'; // Import JwtPayload type
import User from '../models/User'; // Assuming User model default export from models/User.ts
import type { User as UserType } from './types'; // Assuming User interface export from lib/types.ts

/**
 * Decodes the JWT from the request's 'access_token' cookie to extract the user ID.
 * This function assumes the JWT's signature and expiration have already been
 * verified by the middleware. It only performs decoding.
 *
 * @param request - The incoming NextRequest object, containing cookies.
 * @returns The extracted user ID as a string if found and valid in the token payload,
 *          otherwise returns null.
 */
export function getUserIdFromRequest(request: NextRequest): string | null {
  const token = request.cookies.get('access_token')?.value;

  if (!token) {
    // This case should ideally be caught by middleware, but log a warning if reached.
    console.warn(
      'getUserIdFromRequest: Attempted to decode token, but access_token cookie was missing.'
    );
    return null;
  }

  try {
    // Decode the token payload without verifying signature (assumed verified by middleware)
    const decoded = decode(token);

    // Validate the decoded payload structure and check for userId
    if (decoded && typeof decoded === 'object' && 'userId' in decoded) {
      // Use type assertion after checks for safer access
      const payload = decoded as JwtPayload & { userId?: unknown };

      if (typeof payload.userId === 'string' && payload.userId.length > 0) {
        // Successfully extracted valid userId
        return payload.userId;
      } else {
        // userId field exists but is not a non-empty string
        console.error(
          'getUserIdFromRequest: Invalid or empty userId found in JWT payload.',
          payload
        );
        return null;
      }
    } else {
      // Decoded value is not a valid object or doesn't contain userId key
      console.error(
        'getUserIdFromRequest: Invalid JWT payload structure after decoding.',
        decoded
      );
      return null;
    }
  } catch (error) {
    // Catch potential errors during decoding, although unlikely if token format is standard JWT
    console.error('getUserIdFromRequest: Error decoding JWT.', error);
    return null;
  }
}

/**
 * Retrieves the full user session object (excluding password) from the database
 * based on the user ID extracted from the validated JWT in the request cookies.
 * Assumes the JWT is valid (verified by middleware).
 *
 * @param request - The incoming NextRequest object.
 * @returns A Promise resolving to the user object conforming to the UserType interface
 *          (from lib/types.ts, without the password field), or null if the user ID
 *          cannot be extracted, the user is not found in the database, or a
 *          database error occurs.
 */
export async function getSessionUser(
  request: NextRequest
): Promise<UserType | null> {
  const userId = getUserIdFromRequest(request);

  if (!userId) {
    // Failed to get userId from the token payload
    return null;
  }

  try {
    // Fetch the user document by ID from the database.
    // Explicitly exclude the password field for security.
    // Use lean() to return a plain JavaScript object for performance and type compatibility.
    // Assumes database connection is managed elsewhere (e.g., lib/db.ts used in API routes).
    const user = await User.findById(userId)
      .select('-password') // Exclude password hash
      .lean<UserType>() // Return plain JS object matching UserType
      .exec(); // Execute the query

    if (!user) {
      // User ID from token was valid, but no matching user found in the database.
      console.error(
        `getSessionUser: User not found in database for userId: ${userId}`
      );
      return null;
    }

    // Successfully found the user
    return user;
  } catch (error) {
    // Handle potential errors during the database query (e.g., connection issues)
    console.error('getSessionUser: Database error fetching user data.', error);
    return null;
  }
}