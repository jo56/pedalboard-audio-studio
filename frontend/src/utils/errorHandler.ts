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
