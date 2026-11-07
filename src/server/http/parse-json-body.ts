import "server-only";

import { z } from "zod";
import { AppError } from "@/server/errors/app-error";

export async function parseJsonBody<T>(
  request: Request,
  schema: z.ZodType<T>,
): Promise<T> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    throw new AppError(
      "Request body must contain valid JSON.",
      "INVALID_JSON",
      400,
    );
  }

  const result = schema.safeParse(body);

  if (!result.success) {
    throw new AppError(
      "Request body contains invalid data.",
      "VALIDATION_ERROR",
      400,
    );
  }

  return result.data;
}
