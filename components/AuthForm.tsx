'use client';

import React from 'react';
import { useForm, SubmitHandler, FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
// Assuming types are correctly defined in ../lib/types based on project structure
import type { LoginCredentials, SignupCredentials } from '../lib/types';

// Define the possible shapes of the form data
type AuthFormData = LoginCredentials | SignupCredentials;

// Define the props interface for the AuthForm component
interface AuthFormProps {
  mode: 'login' | 'signup';
  onSubmit: (data: AuthFormData) => Promise<void>;
  isLoading: boolean;
  error: string | null; // Form-level error from API/submission logic
}

// Define Zod validation schemas inside the component
const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'), // Login password just needs to be non-empty
});

const signupSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

/**
 * AuthForm Component: Renders a reusable form for user login or signup.
 * Handles client-side validation and delegates submission to the parent.
 * Displays loading states and form-level errors provided via props.
 */
const AuthForm: React.FC<AuthFormProps> = ({
  mode,
  onSubmit,
  isLoading,
  error,
}) => {
  // Determine the validation schema based on the mode
  const currentSchema = mode === 'login' ? loginSchema : signupSchema;

  // Type assertion for useForm to work with the union type
  type CurrentFormData = z.infer<typeof currentSchema>;

  // Initialize react-hook-form
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CurrentFormData>({
    resolver: zodResolver(currentSchema),
    mode: 'onChange', // Validate fields on change for immediate feedback
  });

  // Define the submission handler that calls the onSubmit prop
  // Type needs to accommodate both LoginCredentials and SignupCredentials
  const processSubmit: SubmitHandler<FieldValues> = (data) => {
     // Cast the validated data to the expected AuthFormData union type
     // Zod ensures the data matches either LoginCredentials or SignupCredentials structure based on the schema used
    onSubmit(data as AuthFormData);
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit(processSubmit)}
      noValidate // Disable native browser validation
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2, // Spacing between form elements
        width: '100%', // Take full width of its container
      }}
    >
      {/* Conditionally render Name field for signup */}
      {mode === 'signup' && (
        <TextField
          margin="normal"
          required
          fullWidth
          id="name"
          label="Name"
          autoComplete="name"
          autoFocus // Autofocus on name field in signup mode
          disabled={isLoading}
          {...register('name')} // Register with react-hook-form
          error={!!errors.name}
          helperText={errors.name?.message as string | undefined}
          aria-invalid={errors.name ? 'true' : 'false'}
        />
      )}

      {/* Email Field */}
      <TextField
        margin="normal"
        required
        fullWidth
        id="email"
        label="Email Address"
        type="email" // Use email type for better mobile keyboards and basic validation
        autoComplete="email"
        // Autofocus email field in login mode if name field isn't present
        autoFocus={mode === 'login'}
        disabled={isLoading}
        {...register('email')} // Register with react-hook-form
        error={!!errors.email}
        helperText={errors.email?.message as string | undefined}
        aria-invalid={errors.email ? 'true' : 'false'}
      />

      {/* Password Field */}
      <TextField
        margin="normal"
        required
        fullWidth
        id="password"
        label="Password"
        type="password" // Mask password input
        // Set appropriate autocomplete based on mode
        autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
        disabled={isLoading}
        {...register('password')} // Register with react-hook-form
        error={!!errors.password}
        helperText={errors.password?.message as string | undefined}
        aria-invalid={errors.password ? 'true' : 'false'}
      />

      {/* Display Form-Level Error (from API/submit logic) */}
      {error && (
        <Alert severity="error" sx={{ mt: 1, width: '100%' }} role="alert">
          {error}
        </Alert>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        fullWidth
        variant="contained"
        disabled={isLoading} // Disable button when loading
        sx={{ mt: 3, mb: 2, position: 'relative' }} // Add margins and relative position for spinner
        aria-busy={isLoading} // Indicate busy state for accessibility
      >
        {/* Show spinner inside button when loading */}
        {isLoading ? (
          <>
            <CircularProgress
              size={24}
              sx={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                marginTop: '-12px', // Center spinner vertically
                marginLeft: '-12px', // Center spinner horizontally
                color: 'inherit', // Inherit color from button context
              }}
              aria-label={mode === 'login' ? 'Logging in' : 'Signing up'}
            />
             {/* Hide text when loading to prevent overlap */}
            <span style={{ visibility: 'hidden' }}>
              {mode === 'login' ? 'Login' : 'Sign Up'}
            </span>
          </>
        ) : (
          // Show button text when not loading
          mode === 'login' ? 'Login' : 'Sign Up'
        )}
      </Button>
    </Box>
  );
};

export default AuthForm;