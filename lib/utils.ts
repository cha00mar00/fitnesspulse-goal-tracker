// lib/utils.ts
import { format, isValid, parseISO, isDate } from 'date-fns@4.1.0';

/**
 * Formats a date input (Date object, ISO string, timestamp number, null, or undefined)
 * into a user-friendly string format "MMMM d, yyyy" (e.g., "July 26, 2024").
 * Handles invalid or nullish inputs gracefully by returning an empty string.
 *
 * @function formatDisplayDate
 * @param {Date | string | number | null | undefined} date - The date input to format.
 *        Can be a JavaScript Date object, an ISO 8601 date string, a numeric timestamp (milliseconds since epoch),
 *        null, or undefined.
 * @returns {string} The formatted date string (e.g., "July 26, 2024") if the input is valid,
 *                   otherwise returns an empty string (`''`).
 *
 * @example
 * formatDisplayDate(new Date(2024, 6, 26)); // "July 26, 2024"
 * formatDisplayDate("2024-07-26T10:00:00.000Z"); // "July 26, 2024"
 * formatDisplayDate(1721988000000); // "July 26, 2024"
 * formatDisplayDate(null); // ""
 * formatDisplayDate(undefined); // ""
 * formatDisplayDate("invalid-date-string"); // ""
 */
export function formatDisplayDate(date: Date | string | number | null | undefined): string {
  if (date === null || date === undefined) {
    return '';
  }

  let dateObj: Date;

  try {
    if (isDate(date)) {
      // Already a Date object
      dateObj = date as Date;
    } else if (typeof date === 'string') {
      // Attempt to parse ISO string
      dateObj = parseISO(date);
    } else if (typeof date === 'number') {
      // Assume numeric timestamp
      dateObj = new Date(date);
    } else {
      // Invalid input type
      console.warn('[formatDisplayDate] Received invalid date input type:', typeof date);
      return '';
    }

    // Validate the resulting Date object
    if (!isValid(dateObj)) {
      // Parsing failed or original Date object was invalid
      console.warn('[formatDisplayDate] Input resulted in an invalid date:', date);
      return '';
    }

    // Format the valid date
    return format(dateObj, 'MMMM d, yyyy');

  } catch (error) {
    // Catch any unexpected errors during processing
    console.error('[formatDisplayDate] Error formatting date:', date, error);
    return '';
  }
}


/**
 * Calculates the completion percentage of a goal.
 * Returns the percentage as a number between 0 and 100, inclusive.
 * Returns `null` if the target value is invalid (non-numeric, null, undefined, or non-positive).
 * The current value is treated as 0 if it's invalid (non-numeric, null, or undefined).
 *
 * @function calculateCompletionPercentage
 * @param {number | null | undefined} currentValue - The current progress value towards the goal.
 * @param {number | null | undefined} targetValue - The target value for the goal. Must be a positive number.
 * @returns {number | null} The calculated percentage (0-100) or `null` if the target value is invalid
 *                          for percentage calculation.
 *
 * @example
 * calculateCompletionPercentage(50, 100); // 50
 * calculateCompletionPercentage(0, 100); // 0
 * calculateCompletionPercentage(100, 100); // 100
 * calculateCompletionPercentage(150, 100); // 100 (Clamped)
 * calculateCompletionPercentage(-10, 100); // 0 (Clamped)
 * calculateCompletionPercentage(50, 0); // null (Invalid target)
 * calculateCompletionPercentage(50, -10); // null (Invalid target)
 * calculateCompletionPercentage(50, null); // null (Invalid target)
 * calculateCompletionPercentage(null, 100); // 0
 * calculateCompletionPercentage(undefined, 100); // 0
 * calculateCompletionPercentage(50, undefined); // null
 */
export function calculateCompletionPercentage(
  currentValue: number | null | undefined,
  targetValue: number | null | undefined
): number | null {

  // Validate targetValue: Must be a number and greater than 0.
  if (
    targetValue === null ||
    targetValue === undefined ||
    typeof targetValue !== 'number' ||
    isNaN(targetValue) ||
    targetValue <= 0
  ) {
    // Log if target is zero or negative, as it's a common edge case.
    if (typeof targetValue === 'number' && targetValue <= 0) {
        console.warn(`[calculateCompletionPercentage] Target value (${targetValue}) must be positive for percentage calculation.`);
    }
    return null;
  }

  // Validate currentValue: Treat non-numeric/null/undefined as 0.
  let effectiveCurrentValue = 0;
  if (
    currentValue !== null &&
    currentValue !== undefined &&
    typeof currentValue === 'number' &&
    !isNaN(currentValue)
  ) {
    effectiveCurrentValue = currentValue;
  }

  // Calculate the raw percentage.
  const percentage = (effectiveCurrentValue / targetValue) * 100;

  // Clamp the percentage between 0 and 100.
  // Handles cases where currentValue is negative or exceeds the target.
  const clampedPercentage = Math.max(0, Math.min(percentage, 100));

  // Return the clamped percentage, ensuring it's a valid number.
  // Although intermediate steps should guarantee this, a final check is safe.
  return isNaN(clampedPercentage) ? 0 : clampedPercentage;
}