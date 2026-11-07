import { z } from "zod";

import { authController } from "@/server/controllers/auth";
import { apiSuccess } from "@/server/http/api-response";
import { parseJsonBody } from "@/server/http/parse-json-body";
import { withApiHandler } from "@/server/http/with-api-handler";

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export const POST = withApiHandler(async (request: Request) => {
  const input = await parseJsonBody(request, loginSchema);

  const result = await authController.login(input);

  return apiSuccess(result);
});
