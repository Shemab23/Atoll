import {
  createComment as createCommentService,
  getPostComments as getPostCommentsService,
  updateComment as updateCommentService,
  deleteComment as deleteCommentService,
  type CreateCommentInput,
  type UpdateCommentInput,
} from "@/server/services/comments";
import { getCurrentUser } from "../auth/get-current-user";
import { AppError } from "../errors/app-error";

export class CommentController {
  private async requireAuthenticatedUser() {
    const user = await getCurrentUser();

    if (!user) {
      throw new AppError("Authentication is required.", "UNAUTHORIZED", 401);
    }

    return user;
  }
  async getPostComments(postId: string, limit = 50, offset = 0) {
    const user = await this.requireAuthenticatedUser();

    return getPostCommentsService(user.id, postId, limit, offset);
  }

  async createComment(postId: string, input: CreateCommentInput) {
    const user = await this.requireAuthenticatedUser();

    return createCommentService(user.id, postId, input);
  }

  async updateComment(commentId: string, input: UpdateCommentInput) {
    const user = await this.requireAuthenticatedUser();

    return updateCommentService(user.id, commentId, input);
  }

  async deleteComment(commentId: string) {
    const user = await this.requireAuthenticatedUser();

    return deleteCommentService(user.id, commentId);
  }
}

export const commentController = new CommentController();
