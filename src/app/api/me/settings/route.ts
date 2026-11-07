import { profileController } from "@/server/controllers/profile";
import { apiSuccess } from "@/server/http/api-response";
import { withApiHandler } from "@/server/http/with-api-handler";
import { z } from "zod";

import { parseJsonBody } from "@/server/http/parse-json-body";

export const GET = withApiHandler(async () => {
  const result = await profileController.getCurrentSettings();

  return apiSuccess(result);
});

const settingsSchema = z
  .object({
    isDiscoverable: z.boolean().optional(),
    showOnlineStatus: z.boolean().optional(),
    allowMessages: z.enum(["everyone", "followers", "nobody"]).optional(),
    notificationPreferences: z.record(z.string(), z.unknown()).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one setting must be provided.",
  });

export const PATCH = withApiHandler(async (request: Request) => {
  const input = await parseJsonBody(request, settingsSchema);

  const result = await profileController.updateCurrentSettings(input);

  return apiSuccess(result);
});
