import { z } from "zod";

import { profileController } from "@/server/controllers/profile";
import { apiSuccess } from "@/server/http/api-response";
import { parseJsonBody } from "@/server/http/parse-json-body";
import { withApiHandler } from "@/server/http/with-api-handler";

const updateProfileSchema = z
  .object({
    username: z
      .string()
      .trim()
      .min(3)
      .max(30)
      .regex(/^[a-zA-Z0-9_]{3,30}$/)
      .optional(),

    displayName: z.string().max(60).nullable().optional(),

    bio: z.string().max(500).nullable().optional(),

    avatarUrl: z.string().trim().min(1).max(2048).nullable().optional(),

    coverUrl: z.string().trim().min(1).max(2048).nullable().optional(),

    country: z.string().trim().max(100).nullable().optional(),

    city: z.string().trim().max(100).nullable().optional(),
  })
  .strict()
  .refine((input) => Object.keys(input).length > 0);

export const GET = withApiHandler(async () => {
  const profile = await profileController.getCurrentProfile();

  return apiSuccess(profile);
});

export const PATCH = withApiHandler(async (request: Request) => {
  const input = await parseJsonBody(request, updateProfileSchema);

  const profile = await profileController.updateCurrentProfile(input);

  return apiSuccess(profile);
});
