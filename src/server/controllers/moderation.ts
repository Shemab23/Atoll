import { getCurrentUser } from "@/server/auth/get-current-user";
import { AppError } from "@/server/errors/app-error";

import * as reportService from "@/server/services/reports";
import * as moderationService from "@/server/services/moderation";

export class ModerationController {
  private async requireAuthenticatedUser() {
    const user = await getCurrentUser();

    if (!user) {
      throw new AppError("Authentication is required.", "UNAUTHORIZED", 401);
    }

    return user;
  }

  /**
   * Retrieve reports for the moderation queue.
   * Defaults to pending reports; reviewing reports can also be requested.
   */
  async getQueue(
    options: {
      limit?: number;
      offset?: number;
      status?: "pending" | "reviewing";
    } = {},
  ) {
    const user = await this.requireAuthenticatedUser();

    return reportService.getReports(user.id, {
      limit: options.limit ?? 50,
      offset: options.offset ?? 0,
      status: options.status ?? "pending",
    });
  }

  /**
   * Retrieve one report and its associated target details.
   */
  async getReportDetails(reportId: string) {
    const user = await this.requireAuthenticatedUser();

    return reportService.getReportById(user.id, reportId);
  }

  /**
   * Move a report into the reviewing state.
   */
  async reviewReport(reportId: string) {
    const user = await this.requireAuthenticatedUser();

    return reportService.updateReportStatus(user.id, reportId, "reviewing");
  }

  /**
   * Apply an action against the user/content associated with a report.
   */
  async applyAction(
    input: Parameters<typeof moderationService.applyModerationAction>[1],
  ) {
    const user = await this.requireAuthenticatedUser();

    return moderationService.applyModerationAction(user.id, input);
  }

  /**
   * Apply multiple report-based actions.
   * Each item can succeed or fail independently.
   */
  async applyBatchActions(
    actions: Parameters<
      typeof moderationService.applyBatchReportModerationActions
    >[1],
  ) {
    const user = await this.requireAuthenticatedUser();

    return moderationService.applyBatchReportModerationActions(
      user.id,
      actions,
    );
  }

  /**
   * Retrieve moderation action history.
   */
  async getHistory(
    options: {
      limit?: number;
      offset?: number;
    } = {},
  ) {
    const user = await this.requireAuthenticatedUser();

    return moderationService.getModerationActions(user.id, {
      limit: options.limit ?? 50,
      offset: options.offset ?? 0,
    });
  }
  async getReports(options?: Parameters<typeof reportService.getReports>[1]) {
    const user = await this.requireAuthenticatedUser();
    return reportService.getReports(user.id, options);
  }

  async getReportById(reportId: string) {
    const user = await this.requireAuthenticatedUser();
    return reportService.getReportById(user.id, reportId);
  }

  async updateReportStatus(
    reportId: string,
    status: Parameters<typeof reportService.updateReportStatus>[2],
  ) {
    const user = await this.requireAuthenticatedUser();

    return reportService.updateReportStatus(user.id, reportId, status);
  }

  async getModerationActions(
    options?: Parameters<typeof moderationService.getModerationActions>[1],
  ) {
    const user = await this.requireAuthenticatedUser();

    return moderationService.getModerationActions(user.id, options);
  }

  async applyReportModerationAction(
    input: Parameters<typeof moderationService.applyModerationAction>[1],
  ) {
    const user = await this.requireAuthenticatedUser();

    return moderationService.applyModerationAction(user.id, input);
  }

  async applyBatchReportModerationActions(
    actions: Parameters<
      typeof moderationService.applyBatchReportModerationActions
    >[1],
  ) {
    const user = await this.requireAuthenticatedUser();

    return moderationService.applyBatchReportModerationActions(
      user.id,
      actions,
    );
  }
}

export const moderationController = new ModerationController();
