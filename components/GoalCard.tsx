<?xml version="1.0" encoding="UTF-8"?>
'use client'; // This directive marks the component as a Client Component

import React from 'react';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import { format, isValid, parseISO, isDate } from 'date-fns@4.1.0'; // Using specified version
import type { Goal } from '../lib/types'; // Ensure Goal type includes _id, name, etc.

/**
 * Props interface for the GoalCard component.
 */
interface GoalCardProps {
  /**
   * The fitness goal object to be displayed in the card.
   * Expected to conform to the Goal type defined in ../lib/types.
   */
  goal: Goal;
}

/**
 * Helper function to format dates specifically for GoalCard.
 * Uses date-fns@4.1.0 and handles various input types, returning formatted date or null.
 * @param dateInput - The date value from the goal object (string | Date | undefined).
 * @returns The formatted date string (e.g., "July 26, 2024") or null if invalid/missing.
 */
const formatGoalDeadline = (
  dateInput: string | Date | undefined | null
): string | null => {
  if (!dateInput) {
    return null;
  }

  let dateObj: Date;
  try {
    if (isDate(dateInput)) {
      dateObj = dateInput as Date;
    } else if (typeof dateInput === 'string') {
      dateObj = parseISO(dateInput);
    } else {
      // Should not happen based on Goal type, but good practice
      console.warn('[GoalCard] Invalid deadline type:', typeof dateInput);
      return null;
    }

    if (isValid(dateObj)) {
      return format(dateObj, 'PP'); // Format like 'Jul 26, 2024'
    } else {
      console.warn('[GoalCard] Invalid deadline date value after parsing:', dateInput);
      return null;
    }
  } catch (error) {
    console.error('[GoalCard] Error formatting deadline:', dateInput, error);
    return null;
  }
};


/**
 * GoalCard Component: Displays a summary of a single fitness goal.
 *
 * This Client Component renders goal information within a clickable Material UI Card.
 * It receives goal data via props and links to the corresponding goal detail page.
 * Suitable for use in grids or lists on the dashboard.
 *
 * @param {GoalCardProps} props - Component props containing the goal object.
 * @returns {JSX.Element} The rendered goal card component.
 */
const GoalCard: React.FC<GoalCardProps> = ({ goal }) => {
  // Format the deadline using the helper function
  const formattedDeadline = formatGoalDeadline(goal.deadline);

  return (
    <Card
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%', // Ensure card takes full height of grid item
        boxShadow: 3, // Default elevation
        '&:hover': {
          boxShadow: 6, // Increase shadow on hover
        },
        transition: 'box-shadow 0.3s ease-in-out', // Smooth transition for shadow
      }}
      role="article"
      aria-labelledby={`goal-card-title-${goal._id}`}
    >
      {/* Use Next.js Link component to wrap CardActionArea for navigation */}
      <Link
        href={`/goals/${goal._id}`}
        passHref
        legacyBehavior={false} // Use new Link behavior
        style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexGrow: 1 }} // Ensure link takes up space and inherits styles
        aria-label={`View details for goal: ${goal.name}`}
      >
        {/* CardActionArea makes the card surface interactive */}
        <CardActionArea
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start', // Align content to top
            flexGrow: 1, // Allow action area to grow
          }}
        >
          <CardContent sx={{ flexGrow: 1, width: '100%' }}> {/* Allow content to grow */}
            {/* Goal Name */}
            <Typography
              variant="h6"
              component="h2" // Semantic heading for the card
              gutterBottom
              sx={{ fontWeight: 'bold' }}
              id={`goal-card-title-${goal._id}`}
            >
              {goal.name}
            </Typography>

            {/* Goal Description (truncated) */}
            {goal.description && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  mb: 2, // Margin bottom for spacing
                  // Apply text truncation for potentially long descriptions
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 3, // Limit to 3 lines
                  WebkitBoxOrient: 'vertical',
                  minHeight: '3.6em' // Approximate height for 3 lines (adjust based on line-height)
                }}
              >
                {goal.description}
              </Typography>
            )}

            {/* Spacer Box to push target/deadline to bottom if description is short */}
            <Box sx={{ flexGrow: 1 }} />

            {/* Goal Target Metric/Unit */}
            {goal.targetMetric && (
              <Typography variant="body2" sx={{ mt: 'auto', mb: 1 }}> {/* Push towards bottom */}
                <strong>Target:</strong> {goal.targetMetric}
                {goal.targetUnit ? ` (${goal.targetUnit})` : ''}
              </Typography>
            )}

            {/* Goal Deadline (formatted) */}
            {formattedDeadline && (
              <Typography variant="body2" color="text.secondary">
                <strong>Deadline:</strong> {formattedDeadline}
              </Typography>
            )}
          </CardContent>
        </CardActionArea>
      </Link>
    </Card>
  );
};

export default GoalCard;