import { z } from "zod";

import { adminController } from "@/server/controllers/admin";
import { directUserModerationSchema } from "@/server/services/moderation";
import { apiSuccess } from "@/server/http/api-response";
import { parseJsonBody } from "@/server/http/parse-json-body";
import { withApiHandler } from "@/server/http/with-api-handler";

type RouteContext = {
  params: Promise<{ userId: string }>;
};

export async function POST(request: Request, { params }: RouteContext) {
  return withApiHandler(async () => {
    const { userId } = await params;

    const input = await parseJsonBody(request, directUserModerationSchema);

    return apiSuccess(
      await adminController.applyUserModeration(userId, input),
      201,
    );
  });
}
