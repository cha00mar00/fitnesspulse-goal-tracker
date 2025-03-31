'use client'; // This directive marks the component as a Client Component

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import axios, { AxiosError } from 'axios';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Container from '@mui/material/Container';
import ProgressHistory from '../../../components/ProgressHistory'; // Adjusted relative path
import ProgressLogForm from '../../../components/ProgressLogForm'; // Adjusted relative path
import { formatDisplayDate } from '../../../lib/utils'; // Assuming utils exists
import type {
  Goal,
  ProgressEntry,
  ApiResponse,
  ProgressFormData, // Assume this exists in types.ts for ProgressLogForm data
  GetGoalDetailResponse,
  LogProgressResponse,
} from '../../../lib/types'; // Adjusted relative path

/**
 * GoalDetailPage Component: Displays details for a specific fitness goal,
 * its progress history, and allows logging new progress entries.
 *
 * Fetches data from the API, handles loading and error states, and manages
 * the submission of new progress logs.
 *
 * @returns {JSX.Element} The rendered goal detail page.
 */
export default function GoalDetailPage(): JSX.Element {
  const params = useParams<{ goalId?: string }>(); // Get dynamic route parameter
  const goalId = params?.goalId; // Extract goalId safely

  // State for goal details and progress
  const [goal, setGoal] = useState<Goal | null>(null);
  const [progressEntries, setProgressEntries] = useState<ProgressEntry[]>([]);

  // State for loading and error handling during initial data fetch
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // State for loading and error handling during progress submission
  const [isSubmittingProgress, setIsSubmittingProgress] =
    useState<boolean>(false);
  const [submitProgressError, setSubmitProgressError] = useState<string | null>(
    null
  );

  /**
   * Fetches the goal details and associated progress entries from the API.
   */
  const fetchGoalDetails = useCallback(async () => {
    // Only fetch if goalId is a valid string
    if (typeof goalId !== 'string' || !goalId) {
      setError('Invalid Goal ID.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null); // Clear previous errors

    try {
      const response = await axios.get<GetGoalDetailResponse>(
        `/api/goals/${goalId}`
      );

      // Validate the API response structure and success status
      if (response.data.success && response.data.data) {
        setGoal(response.data.data.goal);
        setProgressEntries(response.data.data.progressEntries || []); // Ensure progressEntries is always an array
        setError(null);
      } else {
        // API indicated failure or data missing
        throw new Error(
          response.data.message || 'Failed to fetch goal details.'
        );
      }
    } catch (err) {
      // Handle network errors or errors thrown from the try block
      const axiosError = err as AxiosError<ApiResponse>;
      const errorMessage =
        axiosError.response?.data?.message ||
        axiosError.response?.data?.error || // Include potential 'error' field
        (err instanceof Error
          ? err.message
          : 'Could not load goal details.');

      console.error('Error fetching goal details:', errorMessage, err);
      setError(errorMessage);
      setGoal(null); // Reset goal state on error
      setProgressEntries([]); // Reset progress entries state on error
    } finally {
      setIsLoading(false); // Ensure loading is stopped
    }
  }, [goalId]); // Depend on goalId

  // useEffect to trigger data fetching when goalId changes or component mounts
  useEffect(() => {
    fetchGoalDetails();
  }, [fetchGoalDetails]); // fetchGoalDetails is memoized and depends on goalId

  /**
   * Handles the submission of a new progress log entry.
   * Posts the data to the API and refreshes the goal details on success.
   */
  const handleProgressSubmit = useCallback(
    async (formData: ProgressFormData) => {
      // Ensure goalId is available before attempting submission
      if (!goalId) {
        setSubmitProgressError('Cannot log progress: Goal ID is missing.');
        return;
      }

      setIsSubmittingProgress(true);
      setSubmitProgressError(null); // Clear previous submission errors

      try {
        // Add the goalId to the form data for the API payload
        const payload = { ...formData, goalId };

        const response = await axios.post<LogProgressResponse>(
          '/api/progress',
          payload
        );

        // Validate API response
        if (response.data.success && response.data.data?.progressEntry) {
          // Progress logged successfully, refresh the goal details and progress list
          await fetchGoalDetails();
          setSubmitProgressError(null); // Clear error on success
          // Optionally: Reset the ProgressLogForm fields if needed (might require passing a reset function)
        } else {
          // API indicated failure
          throw new Error(response.data.message || 'Failed to log progress.');
        }
      } catch (err) {
        // Handle network errors or errors from the try block
        const axiosError = err as AxiosError<ApiResponse>;
        const errorMessage =
          axiosError.response?.data?.message ||
          axiosError.response?.data?.error ||
          (err instanceof Error
            ? err.message
            : 'An unexpected error occurred while logging progress.');

        console.error('Error submitting progress:', errorMessage, err);
        setSubmitProgressError(errorMessage); // Set error state for display
      } finally {
        setIsSubmittingProgress(false); // Ensure submission loading state is reset
      }
    },
    [goalId, fetchGoalDetails] // Depend on goalId and the memoized fetch function
  );

  // Conditional Rendering Logic
  if (isLoading) {
    return (
      <Container maxWidth="md">
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '60vh', // Ensure spinner is visible
          }}
        >
          <CircularProgress aria-label="Loading goal details" />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md">
        <Alert severity="error" sx={{ mt: 2 }} role="alert">
          {error}
        </Alert>
      </Container>
    );
  }

  // Handle case where loading finished but goal is still null (implies fetch failed or goal not found)
  if (!goal) {
    return (
      <Container maxWidth="md">
        <Alert severity="warning" sx={{ mt: 2 }} role="alert">
          Goal not found or could not be loaded. It might have been deleted or
          you may not have permission to view it.
        </Alert>
      </Container>
    );
  }

  // Data loaded successfully, render the goal details and progress sections
  return (
    <Container maxWidth="lg">
      {/* Goal Details Section */}
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {goal.name}
        </Typography>
        {goal.description && (
          <Typography variant="body1" color="text.secondary" paragraph>
            {goal.description}
          </Typography>
        )}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mt: 2 }}>
          {goal.targetMetric && (
            <Typography variant="body2">
              <strong>Target:</strong> {goal.targetMetric}
              {goal.targetUnit ? ` (${goal.targetUnit})` : ''}
            </Typography>
          )}
          {goal.deadline && (
            <Typography variant="body2">
              <strong>Deadline:</strong> {formatDisplayDate(goal.deadline)}
            </Typography>
          )}
        </Box>
      </Paper>

      <Divider sx={{ my: 4 }} />

      {/* Progress Section */}
      <Box component="section" aria-labelledby="progress-heading">
        <Typography
          variant="h5"
          component="h2"
          gutterBottom
          id="progress-heading"
        >
          Log and Track Progress
        </Typography>

        {/* Progress Logging Form */}
        <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
          <ProgressLogForm
            onSubmit={handleProgressSubmit}
            isLoading={isSubmittingProgress}
            // Pass error only if form can display it, otherwise render Alert below
          />
          {/* Display progress submission errors below the form */}
          {submitProgressError && (
            <Alert severity="error" sx={{ mt: 2 }} role="alert">
              {submitProgressError}
            </Alert>
          )}
        </Paper>

        {/* Progress History */}
        <ProgressHistory progressEntries={progressEntries} />
      </Box>
    </Container>
  );
}