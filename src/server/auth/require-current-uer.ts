import "server-only";

import { AppError } from "@/server/errors/app-error";
import { getCurrentUser } from "./get-current-user";

export async function requireCurrentUser() {
  const user = await getCurrentUser();

  if (!user) {
    throw new AppError("Authentication required.", "UNAUTHENTICATED", 401);
  }

  return user;
}
