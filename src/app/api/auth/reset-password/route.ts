import { z } from "zod";

import { authController } from "@/server/controllers/auth";
import { apiSuccess } from "@/server/http/api-response";
import { parseJsonBody } from "@/server/http/parse-json-body";
import { withApiHandler } from "@/server/http/with-api-handler";

const resetPasswordSchema = z.object({
  password: z.string().min(8).max(128),
});

export const POST = withApiHandler(async (request: Request) => {
  const input = await parseJsonBody(request, resetPasswordSchema);

  const result = await authController.resetPassword(input.password);

  return apiSuccess(result);
});
