import {
  blockUser as blockUserService,
  unblockUser as unblockUserService,
  getBlockedUsers as getBlockedUsersService,
} from "@/server/services/blocks";

import { getCurrentUser } from "@/server/auth/get-current-user";
import { AppError } from "@/server/errors/app-error";

export class BlockController {
  private async requireAuthenticatedUser() {
    const user = await getCurrentUser();

    if (!user) {
      throw new AppError("Authentication is required.", "UNAUTHORIZED", 401);
    }

    return user;
  }

  /**
   * Block another user.
   */
  async blockUser(userId: string) {
    const user = await this.requireAuthenticatedUser();

    return blockUserService(user.id, { userId });
  }

  /**
   * Remove a block created by the current user.
   */
  async unblockUser(userId: string) {
    const user = await this.requireAuthenticatedUser();

    return unblockUserService(user.id, userId);
  }

  /**
   * List users blocked by the current user.
   */
  async getBlockedUsers() {
    const user = await this.requireAuthenticatedUser();

    return getBlockedUsersService(user.id);
  }
}

export const blockController = new BlockController();
