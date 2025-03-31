'use client';

import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';
import Divider from '@mui/material/Divider';
import { format, isValid, parseISO, isDate } from 'date-fns@4.1.0';
import type { ProgressEntry } from '../lib/types';

/**
 * Props interface for the ProgressHistory component.
 */
interface ProgressHistoryProps {
  /**
   * An array of progress entries associated with the goal.
   * Can be empty or undefined/null.
   */
  progressEntries: ProgressEntry[] | null | undefined;
}

/**
 * Helper function to format dates specifically for ProgressHistory items.
 * Uses date-fns@4.1.0 and handles various input types.
 * @param dateInput - The date value from the progress entry (string | Date | undefined | null).
 * @returns The formatted date string (e.g., "Jul 26, 2024, 5:30 PM") or "Invalid Date" if invalid/missing.
 */
const formatProgressDate = (
  dateInput: string | Date | undefined | null
): string => {
  if (dateInput === null || dateInput === undefined) {
    if (process.env.NODE_ENV === 'development') {
        console.warn('[ProgressHistory] Received null or undefined date input.');
    }
    return 'Invalid Date';
  }

  let dateObj: Date;

  try {
    if (isDate(dateInput)) {
      // Already a Date object
      dateObj = dateInput as Date;
    } else if (typeof dateInput === 'string') {
      // Attempt to parse ISO string
      dateObj = parseISO(dateInput);
    } else {
      // Invalid input type
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          `[ProgressHistory] Received invalid date input type: ${typeof dateInput}. Value:`, dateInput
        );
      }
      return 'Invalid Date';
    }

    // Validate the resulting Date object
    if (!isValid(dateObj)) {
      // Parsing failed or original Date object was invalid
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          '[ProgressHistory] Input resulted in an invalid date:',
          dateInput
        );
      }
      return 'Invalid Date';
    }

    // Format the valid date using 'PPp' format (e.g., 'Jul 26, 2024, 5:30 PM')
    return format(dateObj, 'PPp');
  } catch (error) {
    // Catch any unexpected errors during processing
    if (process.env.NODE_ENV === 'development') {
        console.error('[ProgressHistory] Error formatting date:', dateInput, error);
    }
    return 'Invalid Date';
  }
};

/**
 * ProgressHistory Component: Displays a chronological list of progress entries for a goal.
 * Renders the history within a Material UI Paper component, handling empty states gracefully.
 * Sorts entries by date, most recent first.
 *
 * @param {ProgressHistoryProps} props - Component props containing the progress entries.
 * @returns {JSX.Element} The rendered progress history section.
 */
const ProgressHistory: React.FC<ProgressHistoryProps> = ({
  progressEntries,
}) => {
  // Sort entries by date descending (most recent first)
  // Handle potential invalid dates during sorting
  const sortedEntries = React.useMemo(() => {
    if (!progressEntries || progressEntries.length === 0) {
      return [];
    }

    // Helper to parse date for sorting, returning null for invalid dates
    const parseEntryDateForSort = (
      dateInput: string | Date | undefined | null
    ): Date | null => {
      if (!dateInput) return null;
      try {
        let dateObj: Date;
        if (isDate(dateInput)) dateObj = dateInput as Date;
        else if (typeof dateInput === 'string') dateObj = parseISO(dateInput);
        else return null;
        return isValid(dateObj) ? dateObj : null;
      } catch {
        return null;
      }
    };

    // Create a shallow copy before sorting
    return [...progressEntries].sort((a, b) => {
      const dateA = parseEntryDateForSort(a.date);
      const dateB = parseEntryDateForSort(b.date);

      // Handle invalid/null dates: push them towards the end (older)
      if (!dateA && !dateB) return 0; // Maintain relative order if both invalid
      if (!dateA) return 1; // a is invalid, b is valid or invalid; a goes after b
      if (!dateB) return -1; // b is invalid, a is valid; b goes after a

      // Both dates are valid, sort descending (newest first)
      return dateB.getTime() - dateA.getTime();
    });
  }, [progressEntries]);

  return (
    <Box component="section" aria-labelledby="progress-history-heading">
      <Typography
        variant="h6"
        component="h3" // Semantic heading for the history section
        gutterBottom
        id="progress-history-heading"
        sx={{ mb: 2 }}
      >
        History
      </Typography>

      {/* Conditional Rendering: Empty State or List */}
      {sortedEntries.length === 0 ? (
        <Typography
          variant="body1"
          sx={{ textAlign: 'center', color: 'text.secondary', mt: 2, p: 2 }}
        >
          No progress has been logged yet.
        </Typography>
      ) : (
        <Paper elevation={1} sx={{ width: '100%' }}>
          <List
            aria-label="Progress History List"
            disablePadding // Remove default list padding if Paper provides it
          >
            {sortedEntries.map((entry, index) => (
              // Use React.Fragment to avoid unnecessary DOM elements for keys/dividers
              <React.Fragment key={entry._id}>
                <ListItem alignItems="flex-start">
                  <ListItemText
                    primary={formatProgressDate(entry.date)}
                    primaryTypographyProps={{ variant: 'body1', fontWeight: 'medium' }}
                    secondary={
                      // Display value and notes if present
                      `Value: ${entry.value}${entry.notes ? ` - Notes: ${entry.notes}` : ''}`
                    }
                    secondaryTypographyProps={{ variant: 'body2', color: 'text.secondary', sx: { mt: 0.5 } }}
                  />
                </ListItem>
                {/* Add Divider between items, but not after the last one */}
                {index < sortedEntries.length - 1 && (
                  <Divider component="li" variant="inset" /> // Inset divider for visual separation
                )}
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );
};

export default ProgressHistory;