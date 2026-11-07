import { z } from "zod";

import { moderationController } from "@/server/controllers/moderation";
import { AppError } from "@/server/errors/app-error";
import { apiSuccess } from "@/server/http/api-response";
import { withApiHandler } from "@/server/http/with-api-handler";

type RouteContext = {
  params: Promise<{ reportId: string }>;
};

export async function POST(_request: Request, { params }: RouteContext) {
  return withApiHandler(async () => {
    const { reportId } = await params;

    if (!z.string().uuid().safeParse(reportId).success) {
      throw new AppError("Invalid report ID.", "VALIDATION_ERROR", 400);
    }

    return apiSuccess(await moderationController.reviewReport(reportId));
  });
}
