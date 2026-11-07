import { z } from "zod";

import { authController } from "@/server/controllers/auth";
import { apiSuccess } from "@/server/http/api-response";
import { parseJsonBody } from "@/server/http/parse-json-body";
import { withApiHandler } from "@/server/http/with-api-handler";

const forgotPasswordSchema = z.object({
  email: z.string().trim().email(),
});

export const POST = withApiHandler(async (request: Request) => {
  const input = await parseJsonBody(request, forgotPasswordSchema);

  const result = await authController.forgotPassword(
    input.email,
    new URL(request.url).origin,
  );

  return apiSuccess(result);
});
