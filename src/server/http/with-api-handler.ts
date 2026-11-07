import "server-only";
import { apiError } from "@/server/errors/api-error";

type ApiHandler<Args extends unknown[]> = (...args: Args) => Promise<Response>;

export function withApiHandler<Args extends unknown[]>(
  handler: ApiHandler<Args>,
) {
  return async (...args: Args): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (error) {
      return apiError(error);
    }
  };
}
