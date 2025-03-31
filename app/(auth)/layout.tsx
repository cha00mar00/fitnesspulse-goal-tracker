<?xml version="1.0" encoding="UTF-8"?>
import React, { ReactNode } from 'react';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';

/**
 * Props for the AuthLayout component.
 */
interface AuthLayoutProps {
  /**
   * The child components (pages like Login or Signup) to be rendered within this layout.
   */
  children: ReactNode;
}

/**
 * AuthLayout Component: Provides a consistent layout structure for authentication pages.
 *
 * This layout centers the content vertically and horizontally within the viewport,
 * making it suitable for displaying login and signup forms. It uses Material UI
 * components for structure and styling.
 *
 * As a React Server Component, it does not use client-side state or hooks.
 * It operates outside the scope of the application's authentication context.
 *
 * @param {AuthLayoutProps} props - Component props containing the children to render.
 * @returns {JSX.Element} The rendered authentication layout.
 */
export default function AuthLayout({ children }: AuthLayoutProps): JSX.Element {
  return (
    // Outer Box container to control overall page layout and centering.
    <Box
      sx={{
        minHeight: '100vh', // Ensure the layout takes at least the full viewport height.
        display: 'flex', // Enable flexbox for centering children.
        flexDirection: 'column', // Stack children vertically.
        alignItems: 'center', // Center children horizontally.
        justifyContent: 'center', // Center children vertically.
        // Apply a subtle background color if needed, or inherit from global styles.
        // backgroundColor: (theme) => theme.palette.background.default,
      }}
    >
      {/* Inner Container to constrain the width of the form content. */}
      <Container
        component="main" // Use semantic main element for the primary content area.
        maxWidth="xs" // Constrain width, suitable for typical auth forms.
        sx={{
          // Add padding or other styles specific to the form container if needed.
          // py: 4, // Example: Add vertical padding
        }}
      >
        {/* Render the actual page content (Login or Signup form) */}
        {children}
      </Container>
    </Box>
  );
}