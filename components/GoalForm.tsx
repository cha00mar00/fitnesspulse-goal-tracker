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
// Assuming GoalFormData is defined in ../lib/types based on project context
import type { GoalFormData } from '../lib/types';

/**
 * Props interface for the GoalForm component.
 */
interface GoalFormProps {
  /**
   * Async function called upon successful form validation and submission.
   * Receives the validated form data. Parent component handles API call.
   */
  onSubmit: (data: GoalFormData) => Promise<void>;
  /**
   * Boolean indicating if the submission process is currently active.
   * Used to disable the form and show loading indicators.
   */
  isLoading: boolean;
  /**
   * Optional string containing form-level error messages resulting from
   * the submission attempt (e.g., API errors), passed from the parent.
   */
  error?: string | null;
}

// Define the Zod validation schema for the goal form data.
const goalSchema = z.object({
  name: z.string().trim().min(1, 'Goal name is required.'),
  description: z.string().trim().optional(),
  targetMetric: z.string().trim().optional(),
  targetUnit: z.string().trim().optional(),
  // Deadline field is omitted as per MVP form requirements specified
});

// Infer the TypeScript type from the Zod schema
type GoalSchemaType = z.infer<typeof goalSchema>;

/**
 * GoalForm Component: Renders a reusable form for creating fitness goals.
 * Handles client-side validation using Zod and react-hook-form.
 * Delegates the actual submission logic (API call) to the parent component via the `onSubmit` prop.
 * Displays loading and error states passed from the parent.
 *
 * @param {GoalFormProps} props - Component props including onSubmit handler, loading state, and optional error message.
 * @returns {JSX.Element} The rendered goal form component.
 */
const GoalForm: React.FC<GoalFormProps> = ({
  onSubmit,
  isLoading,
  error,
}) => {
  // Initialize react-hook-form with the Zod schema resolver
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<GoalSchemaType>({
    resolver: zodResolver(goalSchema),
    mode: 'onChange', // Validate fields on change for immediate feedback
    defaultValues: { // Initialize optional fields to empty string for controlled inputs
        name: '',
        description: '',
        targetMetric: '',
        targetUnit: '',
    }
  });

  /**
   * Internal submission handler called by react-hook-form's handleSubmit.
   * It receives the validated data and calls the onSubmit prop provided by the parent.
   * @param {FieldValues} data - The validated form data from react-hook-form.
   */
  const processSubmit: SubmitHandler<FieldValues> = (data) => {
    // Cast the validated data to the expected GoalFormData type before passing to parent
    // Zod ensures data structure matches GoalSchemaType which aligns with GoalFormData
    onSubmit(data as GoalFormData);
  };

  return (
    <Box
      component="form"
      // Use react-hook-form's handleSubmit to wrap the submission logic
      onSubmit={handleSubmit(processSubmit)}
      noValidate // Disable native browser validation to rely solely on Zod/RHF
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2, // Spacing between form elements
        width: '100%', // Take full width of its container
      }}
    >
      {/* Goal Name Field */}
      <TextField
        margin="normal"
        required // Mark as required visually and for accessibility
        fullWidth
        id="goal-name" // Unique ID for the field
        label="Goal Name"
        autoComplete="off" // Typically 'off' for goal names
        autoFocus // Focus on this field when the form loads
        disabled={isLoading} // Disable field when submitting
        {...register('name')} // Register field with react-hook-form
        error={!!errors.name} // Show error state if validation fails
        helperText={errors.name?.message} // Display validation error message
        aria-invalid={errors.name ? 'true' : 'false'} // Accessibility attribute for invalid state
        aria-describedby={errors.name ? 'goal-name-error' : undefined} // Describe error for screen readers
        InputLabelProps={{ shrink: true }} // Ensure label is always shrunk for potentially empty optional fields
      />
      {/* Optionally render error message separately for screen reader association */}
      {errors.name && (
        <span id="goal-name-error" style={{ display: 'none' }}>
          {errors.name.message}
        </span>
      )}


      {/* Goal Description Field (Optional) */}
      <TextField
        margin="normal"
        fullWidth
        id="goal-description"
        label="Description (Optional)"
        multiline // Allow multiple lines for description
        rows={4} // Suggest number of visible rows
        autoComplete="off"
        disabled={isLoading}
        {...register('description')} // Register optional field
        error={!!errors.description} // Should not typically error unless Zod schema changes
        helperText={errors.description?.message}
        aria-invalid={errors.description ? 'true' : 'false'}
        InputLabelProps={{ shrink: true }}
      />

      {/* Target Metric Field (Optional) */}
      <TextField
        margin="normal"
        fullWidth
        id="goal-targetMetric"
        label="Target Metric (Optional)"
        placeholder="e.g., Distance, Weight, Duration"
        autoComplete="off"
        disabled={isLoading}
        {...register('targetMetric')}
        error={!!errors.targetMetric}
        helperText={errors.targetMetric?.message}
        aria-invalid={errors.targetMetric ? 'true' : 'false'}
        InputLabelProps={{ shrink: true }}
      />

      {/* Target Unit Field (Optional) */}
      <TextField
        margin="normal"
        fullWidth
        id="goal-targetUnit"
        label="Target Unit (Optional)"
        placeholder="e.g., km, kg, minutes"
        autoComplete="off"
        disabled={isLoading}
        {...register('targetUnit')}
        error={!!errors.targetUnit}
        helperText={errors.targetUnit?.message}
        aria-invalid={errors.targetUnit ? 'true' : 'false'}
        InputLabelProps={{ shrink: true }}
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
        disabled={isLoading} // Disable button during submission
        sx={{ mt: 3, mb: 2, position: 'relative', minHeight: '36.5px' }} // Ensure button height doesn't change drastically
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
              aria-label="Creating goal" // Accessibility label for spinner
            />
            {/* Hide text visually but keep for structure */}
            <span style={{ visibility: 'hidden' }}>Create Goal</span>
          </>
        ) : (
          // Show button text when not loading
          'Create Goal'
        )}
      </Button>
    </Box>
  );
};

export default GoalForm;