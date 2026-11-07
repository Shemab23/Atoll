import { profileController } from "@/server/controllers/profile";
import { apiSuccess } from "@/server/http/api-response";
import { withApiHandler } from "@/server/http/with-api-handler";

type RouteContext = {
  params: Promise<{
    username: string;
  }>;
};

export const GET = withApiHandler(
  async (_request: Request, context: RouteContext) => {
    const { username } = await context.params;

    const profile = await profileController.getPublicProfile(username);

    return apiSuccess(profile);
  },
);
