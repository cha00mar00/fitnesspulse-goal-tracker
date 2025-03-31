'use client'; // Mark this as a Client Component

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Alert from '@mui/material/Alert';
import axios, { AxiosError } from 'axios';
import GoalForm from '../../../components/GoalForm'; // Assume GoalForm handles form fields/validation
import type {
  GoalFormData, // Type representing validated data from GoalForm
  ApiResponse,
} from '../../../lib/types';

/**
 * NewGoalPage Component: Renders the page for creating a new fitness goal.
 *
 * This client component displays the `GoalForm` and handles the submission process,
 * including API interaction, loading states, error handling, and redirection upon success.
 * It assumes authentication is handled by the surrounding layout and middleware.
 *
 * @returns {JSX.Element} The rendered new goal page.
 */
export default function NewGoalPage(): JSX.Element {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  /**
   * Handles the submission of the new goal form data.
   * Sends the validated data to the backend API and handles the response.
   */
  const handleGoalSubmit = useCallback(
    async (formData: GoalFormData) => {
      setIsSubmitting(true);
      setSubmitError(null);

      try {
        // Make POST request to create the goal
        // Assumes GoalFormData is compatible with the API payload expected by POST /api/goals
        const response = await axios.post<
          ApiResponse<{ goal: { _id: string } }>
        >('/api/goals', formData);

        // Check if the API response indicates success
        if (response.data.success && response.data.data?.goal) {
          // Goal created successfully, navigate to the dashboard
          // Optional: Show a success message (e.g., via Snackbar) before redirecting
          router.push('/dashboard');
        } else {
          // Handle API indicating failure
          throw new Error(response.data.message || 'Failed to create goal.');
        }
      } catch (err) {
        // Handle errors during the API call or client-side processing
        const axiosError = err as AxiosError<ApiResponse>;
        // Extract a user-friendly error message
        const errorMessage =
          axiosError.response?.data?.message ||
          (err instanceof Error
            ? err.message
            : 'An unexpected error occurred while creating the goal.');

        console.error('Goal creation failed:', errorMessage, err); // Log detailed error
        setSubmitError(errorMessage); // Update error state for display
      } finally {
        // Ensure loading state is reset regardless of outcome
        setIsSubmitting(false);
      }
    },
    [router] // Dependency: router for navigation
  );

  return (
    <Container component="section" maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
        {/* Page Heading */}
        <Typography variant="h4" component="h1" gutterBottom>
          Create New Goal
        </Typography>

        {/* Display Submission Errors */}
        {submitError && (
          <Alert severity="error" sx={{ mb: 3 }} role="alert">
            {submitError}
          </Alert>
        )}

        {/* Goal Creation Form */}
        <GoalForm
          onSubmit={handleGoalSubmit} // Pass the submission handler
          isLoading={isSubmitting} // Pass the loading state
          // error={submitError} // Optional: Pass error to GoalForm if it displays form-level errors
        />
      </Box>
    </Container>
  );
}