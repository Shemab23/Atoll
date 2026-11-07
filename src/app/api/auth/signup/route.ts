import { z } from "zod";

import { authController } from "@/server/controllers/auth";
import { apiSuccess } from "@/server/http/api-response";
import { parseJsonBody } from "@/server/http/parse-json-body";
import { withApiHandler } from "@/server/http/with-api-handler";

function isAtLeast18(dateOfBirth: string) {
  const birthDate = new Date(`${dateOfBirth}T00:00:00.000Z`);

  if (
    Number.isNaN(birthDate.getTime()) ||
    birthDate.toISOString().slice(0, 10) !== dateOfBirth
  ) {
    return false;
  }

  const today = new Date();

  let age = today.getUTCFullYear() - birthDate.getUTCFullYear();

  const birthdayNotReached =
    today.getUTCMonth() < birthDate.getUTCMonth() ||
    (today.getUTCMonth() === birthDate.getUTCMonth() &&
      today.getUTCDate() < birthDate.getUTCDate());

  if (birthdayNotReached) age--;

  return age >= 18;
}

const signupSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8).max(128),
  username: z
    .string()
    .trim()
    .min(3)
    .max(30)
    .transform((value) => value.toLowerCase()),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine(isAtLeast18, "You must be at least 18 years old."),
  displayName: z.string().trim().max(60).optional(),
});

export const POST = withApiHandler(async (request: Request) => {
  const input = await parseJsonBody(request, signupSchema);

  const result = await authController.signup(
    input,
    new URL(request.url).origin,
  );

  return apiSuccess(result, 201);
});
