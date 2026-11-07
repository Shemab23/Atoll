import { z } from "zod";

import { moderationController } from "@/server/controllers/moderation";
import { apiSuccess } from "@/server/http/api-response";
import { parseJsonBody } from "@/server/http/parse-json-body";
import { withApiHandler } from "@/server/http/with-api-handler";

const updateStatusSchema = z.object({
  status: z.enum(["pending", "reviewing", "resolved", "dismissed"]),
});

type RouteContext = {
  params: Promise<{ reportId: string }>;
};

export async function PATCH(request: Request, { params }: RouteContext) {
  return withApiHandler(async () => {
    const { reportId } = await params;
    const input = await parseJsonBody(request, updateStatusSchema);

    return apiSuccess(
      await moderationController.updateReportStatus(reportId, input.status),
    );
  });
}
