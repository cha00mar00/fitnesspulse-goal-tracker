import mongoose, { Schema, model, models, Document, Types } from 'mongoose';
import { hash, compare, genSalt } from 'bcryptjs'; // Using bcryptjs@3.0.2 as specified
import { User as UserType } from '../lib/types'; // Assuming lib/types.ts defines the User interface

/**
 * Mongoose Document interface for the User model.
 * Extends the base Mongoose Document and the shared UserType interface.
 * Includes the password field (not present in UserType) and the comparePassword instance method.
 */
export interface IUserDocument extends Omit<UserType, '_id' | 'createdAt' | 'updatedAt'>, Document {
  _id: Types.ObjectId; // Use Mongoose's ObjectId type
  password: string;
  createdAt: Date; // Provided by timestamps
  updatedAt: Date; // Provided by timestamps

  /**
   * Compares a candidate password with the user's stored hashed password.
   * @param candidatePassword The password string to compare against the stored hash.
   * @returns A promise resolving to true if the passwords match, false otherwise.
   */
  comparePassword(candidatePassword: string): Promise<boolean>;
}

/**
 * Mongoose Schema definition for the User model.
 * Represents the structure of a user document in the MongoDB 'users' collection.
 */
const UserSchema = new Schema<IUserDocument>(
  {
    /**
     * The name of the user.
     */
    name: {
      type: String,
      required: [true, 'User name is required.'],
      trim: true, // Remove leading/trailing whitespace
    },
    /**
     * The email address of the user.
     * Must be unique and is indexed for efficient lookups.
     * Automatically converted to lowercase.
     * Includes basic email format validation.
     */
    email: {
      type: String,
      required: [true, 'User email is required.'],
      unique: true, // Ensure email addresses are unique across the collection
      lowercase: true, // Store email addresses in lowercase
      trim: true, // Remove leading/trailing whitespace
      index: true, // Index this field for faster login lookups
      match: [
        /^\S+@\S+\.\S+$/, // Basic email format validation regex
        'Please provide a valid email address.',
      ],
    },
    /**
     * The hashed password for the user.
     * This field is required but will not be returned in queries by default (`select: false`).
     */
    password: {
      type: String,
      required: [true, 'Password is required.'],
      select: false, // Exclude password field from query results by default
    },
    // createdAt and updatedAt are automatically managed by the timestamps option below
  },
  {
    /**
     * Mongoose schema options.
     * `timestamps: true` automatically adds `createdAt` and `updatedAt` fields
     * to the schema and manages their values upon document creation and updates.
     */
    timestamps: true,
  }
);

/**
 * Mongoose pre-save middleware hook for the User schema.
 * Automatically hashes the user's password before saving the document
 * if the password field has been modified (or is new).
 */
UserSchema.pre<IUserDocument>('save', async function (next) {
  // `this` refers to the document being saved
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) {
    return next(); // Skip hashing if password hasn't changed
  }

  try {
    // Define the salt factor (cost factor) for bcrypt hashing. 10 is a common default.
    const saltFactor = 10;
    // Generate a salt
    const salt = await genSalt(saltFactor);
    // Hash the password using the generated salt
    const hashedPassword = await hash(this.password, salt);
    // Replace the plain text password with the hashed password
    this.password = hashedPassword;
    next(); // Proceed with saving the document
  } catch (error: any) {
    // If an error occurs during hashing, pass it to the next middleware/error handler
    console.error('Error hashing password:', error);
    // Ensure the error is propagated correctly by Mongoose
    next(error);
  }
});

/**
 * Mongoose instance method for comparing a candidate password with the stored hash.
 * Attaches the `comparePassword` method to documents retrieved using the UserModel.
 * @param candidatePassword The plain text password to compare.
 * @returns A Promise resolving to `true` if the passwords match, `false` otherwise.
 */
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  // `this` refers to the user document instance
  try {
    // Use bcryptjs.compare to securely compare the candidate password with the stored hash
    const isMatch = await compare(candidatePassword, this.password);
    return isMatch;
  } catch (error) {
    // Log the error and return false in case of a comparison error
    console.error('Error comparing password:', error);
    return false;
  }
};

/**
 * Mongoose Model for the User collection.
 *
 * Ensures that the model is not re-compiled unnecessarily during development
 * with Next.js hot module replacement (HMR) by checking `mongoose.models`.
 * If the model already exists, it uses the existing one; otherwise, it creates a new one.
 */
const UserModel =
  mongoose.models.User || mongoose.model<IUserDocument>('User', UserSchema);

export default UserModel;