import { getCurrentUser } from "@/server/auth/get-current-user";
import { AppError } from "@/server/errors/app-error";

import * as adminService from "@/server/services/admin";
import * as moderationService from "@/server/services/moderation";

export class AdminController {
  private async requireAuthenticatedUser() {
    const user = await getCurrentUser();

    if (!user) {
      throw new AppError("Authentication is required.", "UNAUTHORIZED", 401);
    }

    return user;
  }

  async getOverview() {
    const user = await this.requireAuthenticatedUser();
    return adminService.getAdminOverview(user.id);
  }

  async getUsers(options: adminService.AdminUserListOptions = {}) {
    const user = await this.requireAuthenticatedUser();
    return adminService.getUsers(user.id, options);
  }

  async getUserById(userId: string) {
    const user = await this.requireAuthenticatedUser();
    return adminService.getUserById(user.id, userId);
  }

  async getAdministrators() {
    const user = await this.requireAuthenticatedUser();
    return adminService.getAdminUsers(user.id);
  }

  async getUserModerationHistory(
    targetUserId: string,
    options?: Parameters<typeof moderationService.getUserModerationHistory>[2],
  ) {
    const user = await this.requireAuthenticatedUser();

    return moderationService.getUserModerationHistory(
      user.id,
      targetUserId,
      options,
    );
  }

  async applyUserModeration(
    targetUserId: string,
    input: moderationService.DirectUserModerationInput,
  ) {
    const user = await this.requireAuthenticatedUser();

    return moderationService.applyUserModerationAction(
      user.id,
      targetUserId,
      input,
    );
  }

  async grantAdministratorRole(
    targetUserId: string,
    role: "admin" | "moderator",
  ) {
    const user = await this.requireAuthenticatedUser();

    return adminService.grantAdminRole(user.id, {
      userId: targetUserId,
      role,
    });
  }

  async revokeAdministratorRole(targetUserId: string) {
    const user = await this.requireAuthenticatedUser();

    return adminService.revokeAdminRole(user.id, targetUserId);
  }
}

export const adminController = new AdminController();
