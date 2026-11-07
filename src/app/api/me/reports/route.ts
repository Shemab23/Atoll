import { z } from "zod";

import { apiSuccess } from "@/server/http/api-response";
import { withApiHandler } from "@/server/http/with-api-handler";
import { reportController } from "@/server/controllers/report";

const querySchema = z
  .object({
    status: z
      .enum(["pending", "reviewing", "resolved", "dismissed", "withdrawn"])
      .optional(),

    limit: z.coerce.number().int().min(1).max(100).default(20),

    offset: z.coerce.number().int().min(0).max(100000).default(0),
  })
  .strict();

export async function GET(request: Request) {
  return withApiHandler(async () => {
    const url = new URL(request.url);

    const query = querySchema.parse({
      status: url.searchParams.get("status") ?? undefined,
      limit: url.searchParams.get("limit") ?? undefined,
      offset: url.searchParams.get("offset") ?? undefined,
    });

    const reports = await reportController.getMyReports(query);

    return apiSuccess(reports);
  });
}
