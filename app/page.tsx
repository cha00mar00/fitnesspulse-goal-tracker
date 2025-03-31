<?xml version="1.0" encoding="UTF-8"?>
import React from 'react';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Link from 'next/link';

/**
 * HomePage Component: The public landing page for FitTrackApp.
 *
 * This component serves as the entry point for unauthenticated users,
 * providing an introduction to the application and links to login or sign up.
 * It uses Material UI components for layout and styling and Next.js Link
 * for client-side navigation.
 *
 * @returns {JSX.Element} The rendered home page component.
 */
export default function HomePage(): JSX.Element {
  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          // Center content vertically and horizontally with flexbox
          minHeight: '100vh', // Ensure box takes full viewport height
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center', // Center items horizontally
          justifyContent: 'center', // Center items vertically
          textAlign: 'center', // Center text within the box
        }}
      >
        {/* Main Application Heading */}
        <Typography
          component="h1"
          variant="h3"
          gutterBottom // Adds bottom margin
          sx={{ fontWeight: 'bold', mb: 2 }} // Add margin bottom for spacing
        >
          Welcome to FitTrackApp
        </Typography>

        {/* Application Description */}
        <Typography variant="h6" color="text.secondary" paragraph>
          Track your fitness goals, monitor your progress easily, and share your
          achievements with friends.
        </Typography>

        {/* Call-to-Action Buttons */}
        <Stack direction="row" spacing={2} sx={{ mt: 4 }}>
          {/* Login Button */}
          <Button
            component={Link} // Use Next.js Link for client-side navigation
            href="/login" // Link destination
            variant="contained" // Primary button style
            size="large" // Larger button size
            aria-label="Login to your account"
          >
            Login
          </Button>

          {/* Sign Up Button */}
          <Button
            component={Link} // Use Next.js Link
            href="/signup" // Link destination
            variant="outlined" // Secondary button style
            size="large" // Larger button size
            aria-label="Sign up for a new account"
          >
            Sign Up
          </Button>
        </Stack>
      </Box>
    </Container>
  );
}