import axios from 'axios';

export const handleError = (error: unknown, context?: string): void => {
  const errorContext = context ? `[${context}]` : '';

  if (import.meta.env.DEV) {
    console.error(`${errorContext} Error:`, error);
  }
};

export const logWarning = (message: string, context?: string): void => {
  const warningContext = context ? `[${context}]` : '';

  if (import.meta.env.DEV) {
    console.warn(`${warningContext} Warning:`, message);
  }
};

export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    // Handle rate limiting
    if (error.response?.status === 429) {
      const detail = error.response.data?.detail;
      if (detail) {
        return detail;
      }
      return 'Rate limit exceeded. Please wait a moment and try again.';
    }

    // Handle quota errors
    if (error.response?.status === 413) {
      return error.response.data?.detail || 'File is too large.';
    }

    // Handle validation errors
    if (error.response?.status === 400) {
      return error.response.data?.detail || 'Invalid request.';
    }

    // Handle not found
    if (error.response?.status === 404) {
      return error.response.data?.detail || 'Resource not found.';
    }

    // Generic server error
    if (error.response?.status && error.response.status >= 500) {
      return 'Server error. Please try again later.';
    }

    // Network error
    if (!error.response) {
      return 'Network error. Please check your connection.';
    }

    return error.response.data?.detail || 'An error occurred.';
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unknown error occurred.';
};
