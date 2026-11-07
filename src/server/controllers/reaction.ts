import {
  removeCommentReaction as removeCommentReactionService,
  removeReaction as removePostReactionService,
  setCommentReaction as setCommentReactionService,
  setReaction as setPostReactionService,
  type SetReactionInput,
} from "@/server/services/reactions";

import { getCurrentUser } from "../auth/get-current-user";
import { AppError } from "../errors/app-error";

export class ReactionController {
  // ---------------------------------------------------------------------------
  // Post reactions
  // ---------------------------------------------------------------------------
  private async requireAuthenticatedUser() {
    const user = await getCurrentUser();

    if (!user) {
      throw new AppError("Authentication is required.", "UNAUTHORIZED", 401);
    }

    return user;
  }

  async setPostReaction(postId: string, input: SetReactionInput) {
    const user = await this.requireAuthenticatedUser();

    return setPostReactionService(user.id, postId, input);
  }

  async removePostReaction(postId: string) {
    const user = await this.requireAuthenticatedUser();

    return removePostReactionService(user.id, postId);
  }

  // ---------------------------------------------------------------------------
  // Comment reactions
  // ---------------------------------------------------------------------------

  async setCommentReaction(commentId: string, input: SetReactionInput) {
    const user = await this.requireAuthenticatedUser();

    return setCommentReactionService(user.id, commentId, input);
  }

  async removeCommentReaction(commentId: string) {
    const user = await this.requireAuthenticatedUser();

    return removeCommentReactionService(user.id, commentId);
  }
}

export const reactionController = new ReactionController();
