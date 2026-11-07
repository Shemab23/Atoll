import { adminController } from "@/server/controllers/admin";
import { apiSuccess } from "@/server/http/api-response";
import { withApiHandler } from "@/server/http/with-api-handler";

export async function GET(request: Request) {
  return withApiHandler(async () => {
    const url = new URL(request.url);

    const limit = Number(url.searchParams.get("limit") ?? 50);
    const offset = Number(url.searchParams.get("offset") ?? 0);
    const search = url.searchParams.get("search") ?? undefined;
    const accountStatus = url.searchParams.get("accountStatus");

    const validStatuses = ["active", "suspended", "deleted"];

    if (accountStatus && !validStatuses.includes(accountStatus)) {
      throw new Error("Invalid accountStatus filter.");
    }

    if (
      !Number.isInteger(limit) ||
      !Number.isInteger(offset) ||
      limit < 1 ||
      limit > 100 ||
      offset < 0
    ) {
      throw new Error("Invalid pagination parameters.");
    }

    return apiSuccess(
      await adminController.getUsers({
        limit,
        offset,
        search,
        accountStatus: accountStatus
          ? (accountStatus as "active" | "suspended" | "deleted")
          : undefined,
      }),
    );
  });
}
