'use client'; // This directive marks the component as a Client Component

import React from 'react';
import { useForm, SubmitHandler, FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
// Assuming ProgressFormData is defined in ../lib/types matching the schema fields
import type { ProgressFormData } from '../lib/types';

/**
 * Props interface for the ProgressLogForm component.
 */
interface ProgressLogFormProps {
  /**
   * Async function called upon successful form validation and submission.
   * Receives the validated form data. Parent component handles API call.
   */
  onSubmit: (data: ProgressFormData) => Promise<void>;
  /**
   * Boolean indicating if the submission process is currently active.
   * Used to disable the form and show loading indicators.
   */
  isLoading: boolean;
  /**
   * Optional string containing form-level error messages resulting from
   * the submission attempt (e.g., API errors), passed from the parent component.
   */
  error?: string | null;
}

// Define the Zod validation schema for the progress log form data.
const progressSchema = z.object({
  // Preprocess the input value: If it's an empty string, treat as NaN, otherwise convert to Number.
  // Then validate that it's a number and positive.
  value: z.preprocess(
    (val) => (val === '' ? NaN : Number(val)),
    z
      .number({ invalid_type_error: 'Value must be a number.' })
      .positive('Value must be a positive number.')
  ),
  // Ensure the date string is not empty (HTML date input provides 'YYYY-MM-DD' format)
  date: z.string().min(1, 'Date is required.'),
  // Notes are optional, trim whitespace if provided
  notes: z.string().trim().optional(),
});

// Infer the TypeScript type from the Zod schema
type ProgressSchemaType = z.infer<typeof progressSchema>;

/**
 * ProgressLogForm Component: Renders a reusable form for logging progress entries against a goal.
 * Handles client-side validation using Zod and react-hook-form.
 * Delegates the actual submission logic (API call) to the parent component via the `onSubmit` prop.
 * Displays loading and error states passed from the parent.
 *
 * @param {ProgressLogFormProps} props - Component props including onSubmit handler, loading state, and optional error message.
 * @returns {JSX.Element} The rendered progress log form component.
 */
const ProgressLogForm: React.FC<ProgressLogFormProps> = ({
  onSubmit,
  isLoading,
  error,
}) => {
  // Initialize react-hook-form with the Zod schema resolver
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset, // Get reset function from useForm
  } = useForm<ProgressSchemaType>({
    resolver: zodResolver(progressSchema),
    mode: 'onChange', // Validate fields on change for immediate feedback
    defaultValues: {
      // Initialize fields for controlled inputs
      value: '' as any, // Start with empty string for input field compatibility
      date: '',
      notes: '',
    },
  });

  /**
   * Internal submission handler called by react-hook-form's handleSubmit.
   * It receives the validated data and calls the onSubmit prop provided by the parent.
   * After successful submission (indicated by onSubmit resolving), it resets the form.
   * @param {FieldValues} data - The validated form data from react-hook-form.
   */
  const processSubmit: SubmitHandler<FieldValues> = async (data) => {
    try {
      // Cast the validated data to the expected ProgressFormData type before passing to parent
      // Zod ensures data structure matches ProgressSchemaType which aligns with ProgressFormData
      await onSubmit(data as ProgressFormData);
      // Reset the form only if the onSubmit promise resolves successfully
      reset();
    } catch (submitError) {
      // Error handling is done by the parent component which sets the `error` prop.
      // Log here for debugging if needed.
      console.error('Submission failed in parent:', submitError);
    }
  };

  return (
    <Box
      component="form"
      // Use react-hook-form's handleSubmit to wrap the submission logic
      onSubmit={handleSubmit(processSubmit)}
      noValidate // Disable native browser validation
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2, // Spacing between form elements
        width: '100%', // Take full width of its container
      }}
    >
      {/* Value Field */}
      <TextField
        margin="normal"
        required // Mark as required visually and for accessibility
        fullWidth
        id="progress-value" // Unique ID for the field
        label="Value"
        type="number" // Use number type input
        InputProps={{ inputProps: { step: 'any' } }} // Allow decimal steps
        disabled={isLoading} // Disable field when submitting
        {...register('value')} // Register field with react-hook-form
        error={!!errors.value} // Show error state if validation fails
        helperText={errors.value?.message} // Display validation error message
        aria-invalid={errors.value ? 'true' : 'false'} // Accessibility attribute for invalid state
        aria-describedby={errors.value ? 'progress-value-error' : undefined} // Describe error for screen readers
      />
      {/* Optionally render error message separately for screen reader association */}
      {errors.value && (
        <span id="progress-value-error" style={{ display: 'none' }}>
          {errors.value.message}
        </span>
      )}

      {/* Date Field */}
      <TextField
        margin="normal"
        required // Mark as required visually and for accessibility
        fullWidth
        id="progress-date" // Unique ID for the field
        label="Date"
        type="date" // Use date type input
        InputLabelProps={{ shrink: true }} // Ensure label doesn't overlap pre-filled dates
        disabled={isLoading} // Disable field when submitting
        {...register('date')} // Register field with react-hook-form
        error={!!errors.date} // Show error state if validation fails
        helperText={errors.date?.message} // Display validation error message
        aria-invalid={errors.date ? 'true' : 'false'} // Accessibility attribute for invalid state
        aria-describedby={errors.date ? 'progress-date-error' : undefined} // Describe error for screen readers
      />
      {/* Optionally render error message separately for screen reader association */}
      {errors.date && (
        <span id="progress-date-error" style={{ display: 'none' }}>
          {errors.date.message}
        </span>
      )}

      {/* Notes Field (Optional) */}
      <TextField
        margin="normal"
        fullWidth
        id="progress-notes" // Unique ID for the field
        label="Notes (Optional)"
        multiline // Allow multiple lines
        rows={3} // Suggest number of visible rows
        disabled={isLoading} // Disable field when submitting
        {...register('notes')} // Register optional field
        error={!!errors.notes} // Should not typically error unless Zod schema changes
        helperText={errors.notes?.message} // Display validation error message
        aria-invalid={errors.notes ? 'true' : 'false'} // Accessibility attribute for invalid state
      />

      {/* Display Form-Level Error (from API/submit logic passed via props) */}
      {error && (
        <Alert severity="error" sx={{ mt: 1, width: '100%' }} role="alert">
          {error}
        </Alert>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        fullWidth
        variant="contained"
        color="primary" // Use theme's primary color
        disabled={isLoading} // Disable button during submission
        sx={{ mt: 3, mb: 2, position: 'relative', minHeight: '36.5px' }} // Ensure button height consistency
        aria-busy={isLoading} // Indicate busy state for accessibility
      >
        {/* Show spinner inside button when loading */}
        {isLoading ? (
          <>
            <CircularProgress
              size={24}
              sx={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                marginTop: '-12px', // Center spinner vertically
                marginLeft: '-12px', // Center spinner horizontally
                color: 'inherit', // Inherit color for contrast
              }}
              aria-label="Logging progress" // Accessibility label for spinner
            />
            {/* Hide text visually but keep for structure */}
            <span style={{ visibility: 'hidden' }}>Log Progress</span>
          </>
        ) : (
          // Show button text when not loading
          'Log Progress'
        )}
      </Button>
    </Box>
  );
};

export default ProgressLogForm;