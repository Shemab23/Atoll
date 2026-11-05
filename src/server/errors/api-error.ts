import { AppError } from "./app-error";

export function apiError(error: unknown): Response {
  if (error instanceof AppError) {
    return Response.json(
      {
        error: {
          code: error.code,
          message: error.message,
        },
      },
      {
        status: error.statusCode,
      },
    );
  }

  // Unexpected errors should not expose database or server details.
  console.error("Unexpected API error:", error);

  return Response.json(
    {
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Something went wrong. Please try again.",
      },
    },
    {
      status: 500,
    },
  );
}
