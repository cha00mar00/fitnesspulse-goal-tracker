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
 * LoginPage Component: Renders the user login page.
 *
 * This client component integrates the shared `AuthForm` configured for login mode.
 * It leverages the `useAuth` hook to access the login function, loading status,
 * and error messages from the global authentication context.
 * It also provides a link for users to navigate to the signup page.
 *
 * @returns {JSX.Element} The rendered login page.
 */
export default function LoginPage(): JSX.Element {
  // Retrieve authentication state and actions from the context
  const { login, isLoading, error } = useAuth();

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
        Login
      </Typography>

      {/* Authentication Form */}
      <AuthForm
        mode="login"
        onSubmit={login} // Pass the login function from AuthContext
        isLoading={isLoading} // Pass loading state from AuthContext
        error={error} // Pass error state from AuthContext
      />

      {/* Link to Signup Page */}
      <Typography variant="body2" sx={{ mt: 1 }}>
        {"Don't have an account? "}
        <MuiLink
          component={Link} // Integrate Next.js Link for client-side navigation
          href="/signup"
          underline="hover" // Standard link styling
          aria-label="Navigate to the sign up page"
        >
          Sign Up
        </MuiLink>
      </Typography>
    </Box>
  );
}