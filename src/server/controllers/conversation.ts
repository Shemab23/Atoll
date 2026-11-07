import {
  createDirectConversation as createDirectConversationService,
  createGroupConversation as createGroupConversationService,
  getUserConversations as getUserConversationsService,
  getConversationDetails as getConversationDetailsService,
  addConversationMember as addConversationMemberService,
  removeConversationMember as removeConversationMemberService,
  type CreateDirectConversationInput,
  type CreateGroupConversationInput,
  type AddConversationMemberInput,
} from "@/server/services/conversations";

import { getCurrentUser } from "@/server/auth/get-current-user";
import { AppError } from "@/server/errors/app-error";

export type CreateConversationInput =
  | ({ type: "direct" } & CreateDirectConversationInput)
  | ({ type: "group" } & CreateGroupConversationInput);

export class ConversationController {
  private async requireAuthenticatedUser() {
    const user = await getCurrentUser();

    if (!user) {
      throw new AppError("Authentication is required.", "UNAUTHORIZED", 401);
    }

    return user;
  }

  /**
   * List conversations belonging to the current user.
   */
  async getConversations() {
    const user = await this.requireAuthenticatedUser();

    return getUserConversationsService(user.id);
  }

  /**
   * Create a direct or group conversation.
   */
  async createConversation(input: CreateConversationInput) {
    const user = await this.requireAuthenticatedUser();

    if (input.type === "direct") {
      return createDirectConversationService(user.id, {
        participantId: input.participantId,
      });
    }

    return createGroupConversationService(user.id, {
      participantIds: input.participantIds,
    });
  }

  /**
   * Retrieve one conversation and its active members.
   */
  async getConversationDetails(conversationId: string) {
    const user = await this.requireAuthenticatedUser();

    return getConversationDetailsService(user.id, conversationId);
  }

  /**
   * Add a member to a group conversation.
   */
  async addMember(conversationId: string, input: AddConversationMemberInput) {
    const user = await this.requireAuthenticatedUser();

    return addConversationMemberService(user.id, conversationId, input);
  }

  /**
   * Remove another member from a group conversation.
   */
  async removeMember(conversationId: string, userId: string) {
    const user = await this.requireAuthenticatedUser();

    return removeConversationMemberService(user.id, conversationId, userId);
  }

  /**
   * Leave a conversation.
   */
  async leaveConversation(conversationId: string) {
    const user = await this.requireAuthenticatedUser();

    return removeConversationMemberService(user.id, conversationId, user.id);
  }
}

export const conversationController = new ConversationController();
