import {
  getUserNotifications as getUserNotificationsService,
  markNotificationAsRead as markNotificationAsReadService,
  markAllNotificationsAsRead as markAllNotificationsAsReadService,
} from "@/server/services/notifications";

import { getCurrentUser } from "@/server/auth/get-current-user";
import { AppError } from "@/server/errors/app-error";

export class NotificationController {
  /**
   * Ensures the request is made by an authenticated user.
   */
  private async requireAuthenticatedUser() {
    const user = await getCurrentUser();

    if (!user) {
      throw new AppError("Authentication is required.", "UNAUTHORIZED", 401);
    }

    return user;
  }

  /**
   * Retrieves notifications belonging to the authenticated user.
   */
  async getMyNotifications(options?: {
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
  }) {
    const user = await this.requireAuthenticatedUser();

    return getUserNotificationsService(user.id, options);
  }

  /**
   * Marks one notification as read.
   */
  async markAsRead(notificationId: string) {
    const user = await this.requireAuthenticatedUser();

    return markNotificationAsReadService(user.id, notificationId);
  }

  /**
   * Marks all unread notifications as read.
   */
  async markAllAsRead() {
    const user = await this.requireAuthenticatedUser();

    return markAllNotificationsAsReadService(user.id);
  }
}

export const notificationController = new NotificationController();
