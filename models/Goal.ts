import mongoose, { Schema, model, models, Document, Types } from 'mongoose';
import { Goal as GoalType } from '../lib/types'; // Assuming lib/types.ts defines the Goal interface

/**
 * Mongoose Document interface for the Goal model.
 * Extends the base Mongoose Document and the shared GoalType interface.
 */
export interface IGoalDocument extends GoalType, Document {
  _id: Types.ObjectId; // Override ObjectIdString with Mongoose's ObjectId type
  userId: Types.ObjectId; // Override ObjectIdString with Mongoose's ObjectId type
  deadline?: Date; // Ensure Date type for Mongoose
  createdAt: Date; // Provided by timestamps
  updatedAt: Date; // Provided by timestamps
}

/**
 * Mongoose Schema definition for the Goal model.
 * Represents the structure of a fitness goal document in the MongoDB 'goals' collection.
 */
const GoalSchema = new Schema<IGoalDocument>(
  {
    /**
     * The ID of the User who owns this goal.
     * Creates a relationship with the 'User' collection.
     * Indexed for efficient querying of goals by user.
     */
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User', // Reference to the User model
      required: [true, 'User ID is required.'],
      index: true, // Index this field for faster lookups
    },
    /**
     * The name or title of the fitness goal.
     */
    name: {
      type: String,
      required: [true, 'Goal name is required.'],
      trim: true, // Remove leading/trailing whitespace
    },
    /**
     * An optional description providing more details about the goal.
     */
    description: {
      type: String,
      required: false,
      trim: true,
    },
    /**
     * An optional metric to track for the goal (e.g., 'Weight', 'Distance').
     */
    targetMetric: {
      type: String,
      required: false,
      trim: true,
    },
    /**
     * An optional unit associated with the target metric (e.g., 'kg', 'km').
     */
    targetUnit: {
      type: String,
      required: false,
      trim: true,
    },
    /**
     * An optional deadline date for achieving the goal.
     */
    deadline: {
      type: Date,
      required: false,
    },
    // createdAt and updatedAt are automatically managed by the timestamps option below
  },
  {
    /**
     * Mongoose schema options.
     * `timestamps: true` automatically adds `createdAt` and `updatedAt` fields
     * to the schema and manages their values.
     */
    timestamps: true,
  }
);

/**
 * Mongoose Model for the Goal collection.
 *
 * Includes logic to prevent OverwriteModelError in Next.js development mode
 * by reusing the existing model if it has already been compiled.
 */
const GoalModel =
  models.Goal || model<IGoalDocument>('Goal', GoalSchema);

export default GoalModel;