import { moderationController } from "@/server/controllers/moderation";
import { apiSuccess } from "@/server/http/api-response";
import { withApiHandler } from "@/server/http/with-api-handler";
import { ReportStatus } from "@/server/services/reports";

export async function GET(request: Request) {
  return withApiHandler(async () => {
    const url = new URL(request.url);

    const limit = Number(url.searchParams.get("limit") ?? 50);
    const offset = Number(url.searchParams.get("offset") ?? 0);

    if (
      !Number.isInteger(limit) ||
      !Number.isInteger(offset) ||
      limit < 1 ||
      limit > 100 ||
      offset < 0
    ) {
      throw new Error("Invalid pagination parameters.");
    }

    const status = url.searchParams.get("status") as ReportStatus | undefined;

    return apiSuccess(
      await moderationController.getReports({
        limit,
        offset,
        status,
      }),
    );
  });
}
