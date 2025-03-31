import mongoose, { Schema, model, models, Document, Types } from 'mongoose';
import { ProgressEntry as ProgressEntryType } from '../lib/types'; // Assuming lib/types.ts defines the ProgressEntry interface

/**
 * Mongoose Document interface for the Progress model.
 * Extends the base Mongoose Document and the shared ProgressEntryType interface.
 */
export interface IProgressDocument extends ProgressEntryType, Document {
  _id: Types.ObjectId; // Override ObjectIdString with Mongoose's ObjectId type
  goalId: Types.ObjectId; // Override ObjectIdString with Mongoose's ObjectId type
  userId: Types.ObjectId; // Override ObjectIdString with Mongoose's ObjectId type
  date: Date; // Ensure Date type for Mongoose
  createdAt: Date; // Provided by timestamps
  updatedAt: Date; // Provided by timestamps
}

/**
 * Mongoose Schema definition for the Progress model.
 * Represents the structure of a progress entry document in the MongoDB 'progress' collection.
 */
const ProgressSchema = new Schema<IProgressDocument>(
  {
    /**
     * The ID of the Goal this progress entry is associated with.
     * Creates a relationship with the 'Goal' collection.
     * Indexed for efficient querying of progress by goal.
     */
    goalId: {
      type: Schema.Types.ObjectId,
      ref: 'Goal', // Reference to the Goal model
      required: [true, 'Goal ID is required.'],
      index: true, // Index this field for faster lookups of progress for a goal
    },
    /**
     * The ID of the User who owns this progress entry (and the associated goal).
     * Creates a relationship with the 'User' collection.
     * Indexed for efficient querying of progress by user.
     */
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User', // Reference to the User model
      required: [true, 'User ID is required.'],
      index: true, // Index this field for faster lookups
    },
    /**
     * The numerical value representing the progress made.
     * Must be a finite number.
     */
    value: {
      type: Number,
      required: [true, 'Progress value is required.'],
      validate: {
        validator: Number.isFinite, // Ensures value is not Infinity, -Infinity, or NaN
        message: 'Progress value must be a finite number.',
      },
    },
    /**
     * The date when the progress was achieved or logged.
     * Indexed for efficient sorting and filtering by date.
     */
    date: {
      type: Date,
      required: [true, 'Progress date is required.'],
      index: true, // Index for sorting/filtering by date
    },
    /**
     * Optional notes or comments related to the progress entry.
     */
    notes: {
      type: String,
      required: false,
      trim: true, // Remove leading/trailing whitespace
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
 * Mongoose Model for the Progress collection.
 *
 * Includes logic to prevent OverwriteModelError in Next.js development mode
 * by reusing the existing model if it has already been compiled.
 */
const ProgressModel =
  models.Progress || model<IProgressDocument>('Progress', ProgressSchema);

export default ProgressModel;