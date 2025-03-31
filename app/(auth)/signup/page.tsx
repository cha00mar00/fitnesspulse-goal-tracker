<?xml version="1.0" encoding="UTF-8"?>
'use client'; // This directive marks the component as a Client Component

import React from 'react';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import MuiLink from '@mui/material/Link'; // Alias MUI Link to avoid naming conflict
import { useAuth } from '../../../context/AuthContext'; // Adjusted relative path
import AuthForm from '../../../components/AuthForm'; // Adjusted relative path

/**
 * SignupPage Component: Renders the user registration page.
 *
 * This client component integrates the shared `AuthForm` configured for signup mode.
 * It leverages the `useAuth` hook to access the signup function, loading status,
 * and error messages from the global authentication context.
 * It also provides a link for users to navigate to the login page.
 *
 * @returns {JSX.Element} The rendered signup page.
 */
export default function SignupPage(): JSX.Element {
  // Retrieve authentication state and actions from the context
  const { signup, isLoading, error } = useAuth();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%', // Ensure Box takes full width within the centered Container from layout
        gap: 2, // Add spacing between elements
        mt: 2, // Add some top margin if needed, though centering is done by layout
      }}
    >
      {/* Page Heading */}
      <Typography component="h1" variant="h5" gutterBottom>
        Sign Up
      </Typography>

      {/* Authentication Form */}
      <AuthForm
        mode="signup"
        onSubmit={signup} // Pass the signup function from AuthContext
        isLoading={isLoading} // Pass loading state from AuthContext
        error={error} // Pass error state from AuthContext
      />

      {/* Link to Login Page */}
      <Typography variant="body2" sx={{ mt: 1 }}>
        {'Already have an account? '}
        <MuiLink
          component={Link} // Integrate Next.js Link for client-side navigation
          href="/login" // Link destination
          underline="hover" // Standard link styling
          aria-label="Navigate to the login page"
        >
          Login
        </MuiLink>
      </Typography>
    </Box>
  );
}