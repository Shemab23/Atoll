import {
  createReport as createReportService,
  getMyReports as getMyReportsService,
  withdrawReport as withdrawReportService,
  type CreateReportInput,
  type ReportListStatus,
} from "@/server/services/reports";

import { getCurrentUser } from "@/server/auth/get-current-user";
import { AppError } from "@/server/errors/app-error";

export class ReportController {
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
   * Submit a report against a post, comment, or message.
   */
  async createReport(input: CreateReportInput) {
    const user = await this.requireAuthenticatedUser();

    return createReportService(user.id, input);
  }

  /**
   * Retrieve reports submitted by the authenticated user.
   */
  async getMyReports(options?: {
    status?: ReportListStatus;
    limit?: number;
    offset?: number;
  }) {
    const user = await this.requireAuthenticatedUser();

    return getMyReportsService(user.id, options);
  }

  /**
   * Withdraw a report submitted by the authenticated user.
   */
  async withdrawReport(reportId: string) {
    const user = await this.requireAuthenticatedUser();

    return withdrawReportService(user.id, reportId);
  }
}

export const reportController = new ReportController();
