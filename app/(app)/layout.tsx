<?xml version="1.0" encoding="UTF-8"?>
'use client'; // This directive marks the component as a Client Component

import React, { ReactNode } from 'react';
import { AuthProvider } from '../../../context/AuthContext'; // Path relative to app/(app)/layout.tsx
import AppHeader from '../../../components/AppHeader'; // Path relative to app/(app)/layout.tsx - Assume this component exists
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';

/**
 * Props for the AppLayout component.
 */
interface AppLayoutProps {
  /**
   * The child components (authenticated pages like Dashboard, Goal Details)
   * to be rendered within this layout.
   */
  children: ReactNode;
}

/**
 * AppLayout Component: The primary layout for authenticated sections of the FitTrackApp.
 *
 * This Client Component wraps authenticated routes/pages with the global `AuthProvider`
 * to manage and provide authentication state. It renders a common `AppHeader` for
 * navigation and structures the main content area using Material UI components.
 * Route protection for this layout group `(app)` is assumed to be handled by `middleware.ts`.
 *
 * @param {AppLayoutProps} props - Component props containing the children to render.
 * @returns {JSX.Element} The rendered layout for authenticated application sections.
 */
export default function AppLayout({ children }: AppLayoutProps): JSX.Element {
  return (
    // Root Box for the authenticated layout structure.
    // Can apply global background or flex properties if needed.
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Provide the authentication context to all nested components */}
      <AuthProvider>
        {/* Render the common application header/navigation */}
        <AppHeader />

        {/* Main content container for the page */}
        <Container
          component="main" // Use semantic <main> element
          maxWidth="lg" // Set appropriate max width for content area (adjust as needed)
          sx={{
            // Add vertical padding for spacing between header/footer and content
            pt: 4, // Padding top
            pb: 4, // Padding bottom
            flexGrow: 1, // Allow container to grow and push footer down if using flex column layout
            display: 'flex', // Use flex to allow content to fill height if necessary
            flexDirection: 'column', // Stack content vertically
          }}
        >
          {/* Render the specific page component passed as children */}
          {children}
        </Container>
        {/* Potential Footer component could be added here, outside the main Container */}
      </AuthProvider>
    </Box>
  );
}