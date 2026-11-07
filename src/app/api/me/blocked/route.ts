import { blockController } from "@/server/controllers/block";
import { apiSuccess } from "@/server/http/api-response";
import { withApiHandler } from "@/server/http/with-api-handler";

/**
 * GET /api/me/blocked
 * List users blocked by the authenticated user.
 */
export const GET = withApiHandler(async () => {
  const result = await blockController.getBlockedUsers();

  return apiSuccess(result);
});
