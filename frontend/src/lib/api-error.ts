type ApiErrorResponse = {
  response?: {
    data?: {
      message?: string | string[];
    };
  };
};

export function getErrorMessage(error: unknown, fallback: string): string {
  const message = (error as ApiErrorResponse).response?.data?.message;

  if (Array.isArray(message)) {
    return message.join(", ");
  }

  return message || fallback;
}
