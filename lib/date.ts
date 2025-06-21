/**
 * Formats a date string into a human-readable format
 * @param dateString - The date string to format (can be string, null, or undefined)
 * @returns Formatted date string or 'No date available' if invalid
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return 'No date available';
  
  try {
    const date = new Date(dateString);
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date');
    }
    
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
}
