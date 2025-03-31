<?xml version="1.0" encoding="UTF-8"?><?xml version="1.0" encoding="UTF-8"?>
'use client'; // This directive marks the component as a Client Component

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import axios, { AxiosError } from 'axios';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import GoalCard from '../../../components/GoalCard'; // Assuming GoalCard exists and accepts a `goal` prop
import type { Goal, ApiResponse } from '../../../lib/types'; // Assuming these types are defined

/**
 * DashboardPage Component: The main dashboard for authenticated users.
 *
 * Fetches and displays the user's fitness goals, handles loading and error states
 * during data fetching, and provides a clear call-to-action to create new goals.
 * This component operates within the authenticated application layout, relying on
 * the AuthProvider for context and automatic cookie handling for API requests.
 *
 * @returns {JSX.Element} The rendered dashboard page component.
 */
export default function DashboardPage(): JSX.Element {
  // State for storing goals, loading status, and potential errors
  const [goals, setGoals] = useState<Goal[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // useEffect hook to fetch goals when the component mounts
  useEffect(() => {
    /**
     * Asynchronously fetches the user's goals from the API.
     * Updates component state based on the API response (goals, loading, error).
     */
    const fetchGoals = async () => {
      setIsLoading(true);
      setError(null); // Reset error state before fetching
      try {
        // Make GET request to the goals API endpoint
        const response = await axios.get<ApiResponse<{ goals: Goal[] }>>(
          '/api/goals'
        );

        // Check if the API response indicates success and contains goals data
        if (response.data.success && response.data.data?.goals) {
          setGoals(response.data.data.goals); // Update goals state
          setError(null); // Clear any previous error
        } else {
          // Handle cases where API returns success:false or missing data
          throw new Error(response.data.message || 'Failed to fetch goals');
        }
      } catch (err) {
        // Handle errors during the API call
        const axiosError = err as AxiosError<ApiResponse>;
        // Extract a user-friendly error message
        const errorMessage =
          axiosError.response?.data?.message ||
          (err instanceof Error
            ? err.message
            : 'An unknown error occurred while fetching goals.');

        console.error('Failed to fetch goals:', errorMessage, err); // Log detailed error
        setError(errorMessage); // Update error state for display
        setGoals(null); // Clear goals state on error
      } finally {
        // Ensure loading state is set to false regardless of success or failure
        setIsLoading(false);
      }
    };

    fetchGoals(); // Invoke the fetch function
  }, []); // Empty dependency array ensures this effect runs only once on mount

  // Render the component UI
  return (
    <Box sx={{ width: '100%' }}>
      {/* Page Heading */}
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>

      {/* Button to Create New Goal */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
        <Button
          component={Link} // Use Next.js Link for navigation
          href="/goals/new" // Link to the goal creation page
          variant="contained"
          color="primary"
          startIcon={<AddCircleOutlineIcon />} // Icon indicating creation
          aria-label="Create a new fitness goal"
        >
          Create New Goal
        </Button>
      </Box>

      {/* Conditional Rendering based on loading, error, and data states */}
      {isLoading ? (
        // Loading State: Display a centered spinner
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '200px', // Ensure spinner area has some height
            width: '100%',
          }}
        >
          <CircularProgress aria-label="Loading goals" />
        </Box>
      ) : error ? (
        // Error State: Display an error alert message
        <Alert severity="error" sx={{ mt: 2 }} role="alert">
          {error}
        </Alert>
      ) : goals && goals.length > 0 ? (
        // Success State (with goals): Display goals in a grid
        <Grid container spacing={3}>
          {goals.map((goal) => (
            <Grid item xs={12} sm={6} md={4} key={goal._id}>
              {/* Render GoalCard component for each goal */}
              <GoalCard goal={goal} />
            </Grid>
          ))}
        </Grid>
      ) : (
        // Empty State (no goals): Display an informative message
        <Typography
          variant="body1"
          sx={{ mt: 4, textAlign: 'center', color: 'text.secondary' }}
        >
          You haven't created any goals yet. Get started by creating one!
        </Typography>
      )}
    </Box>
  );
}