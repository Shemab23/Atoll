import { z } from "zod";

import { profileController } from "@/server/controllers/profile";
import { apiSuccess } from "@/server/http/api-response";
import { parseJsonBody } from "@/server/http/parse-json-body";
import { withApiHandler } from "@/server/http/with-api-handler";

const deleteAccountSchema = z.object({
  currentPassword: z.string().min(1),
});

export const DELETE = withApiHandler(async (request: Request) => {
  const input = await parseJsonBody(request, deleteAccountSchema);

  const result = await profileController.deleteCurrentAccount(
    input.currentPassword,
  );

  return apiSuccess(result);
});
