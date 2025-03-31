/**
 * This file defines shared TypeScript interfaces and types used across the FitTrackApp MVP.
 * It ensures type safety and consistency for data entities and API payloads.
 */

// Represents MongoDB ObjectIds as strings for API contracts and frontend usage.
export type ObjectIdString = string;

/**
 * Represents the authenticated user data available on the client-side or in API responses.
 * Excludes sensitive information like password hashes.
 */
export interface User {
  _id: ObjectIdString;
  name: string;
  email: string;
  createdAt: string | Date; // ISO 8601 date string or Date object
  updatedAt: string | Date; // ISO 8601 date string or Date object
}

/**
 * Represents a fitness goal tracked by a user.
 */
export interface Goal {
  _id: ObjectIdString;
  userId: ObjectIdString; // Reference to the User who owns this goal
  name: string;
  description?: string;
  targetMetric?: string; // e.g., 'Weight', 'Distance', 'Duration', 'Reps'
  targetUnit?: string; // e.g., 'kg', 'km', 'minutes', 'reps'
  deadline?: string | Date; // Optional deadline as ISO string or Date
  createdAt: string | Date; // ISO 8601 date string or Date object
  updatedAt: string | Date; // ISO 8601 date string or Date object
}

/**
 * Represents a single progress log entry made against a specific fitness goal.
 */
export interface ProgressEntry {
  _id: ObjectIdString;
  goalId: ObjectIdString; // Reference to the associated Goal
  userId: ObjectIdString; // Reference to the User who owns this entry
  value: number; // The numerical value of the progress logged
  date: string | Date; // Date the progress was achieved/logged (ISO string or Date)
  notes?: string; // Optional notes about the progress
  createdAt: string | Date; // ISO 8601 date string or Date object
}

// --- API Payload Types ---

/**
 * Credentials required for user login.
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Details required for user signup.
 */
export interface SignupDetails {
  name: string;
  email: string;
  password: string;
}

/**
 * Payload for creating a new fitness goal via the API.
 */
export interface CreateGoalPayload {
  name: string;
  description?: string;
  targetMetric?: string;
  targetUnit?: string;
  deadline?: string | Date; // Accepts ISO string or Date object from client
}

/**
 * Payload for updating an existing fitness goal via the API (partial updates allowed).
 */
export interface UpdateGoalPayload {
  name?: string;
  description?: string;
  targetMetric?: string;
  targetUnit?: string;
  deadline?: string | Date; // Accepts ISO string or Date object from client
}

/**
 * Payload for logging new progress against a goal via the API.
 */
export interface LogProgressPayload {
  goalId: ObjectIdString;
  value: number;
  date: string | Date; // Accepts ISO string or Date object from client
  notes?: string;
}

// --- API Response Types (Generic Example) ---

/**
 * A generic structure for standardizing API responses.
 * Can be adapted or extended based on specific API needs.
 * @template T - The type of the data included in a successful response.
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string; // Optional message (e.g., success message or general info)
  data?: T; // The actual data payload for successful responses
  error?: string; // Error message for failed responses
  // You might add other fields like error codes, validation errors, etc.
  // validationErrors?: Record<string, string>;
}

/**
 * Represents the structure of the decoded JWT payload.
 * Assumes the payload contains at least the userId.
 */
export interface JwtPayload {
  userId: ObjectIdString;
  iat?: number; // Issued at timestamp (standard JWT claim)
  exp?: number; // Expiration timestamp (standard JWT claim)
}

// Example of a more specific API response type
export type LoginResponse = ApiResponse<{ user: Omit<User, 'password'> }>; // Omit sensitive fields
export type GetGoalsResponse = ApiResponse<{ goals: Goal[] }>;
export type GetGoalDetailResponse = ApiResponse<{
  goal: Goal;
  progressEntries: ProgressEntry[];
}>;
export type CreateGoalResponse = ApiResponse<{ goal: Goal }>;
export type UpdateGoalResponse = ApiResponse<{ goal: Goal }>;
export type DeleteGoalResponse = ApiResponse<null>; // Often no data on success
export type LogProgressResponse = ApiResponse<{ progressEntry: ProgressEntry }>;