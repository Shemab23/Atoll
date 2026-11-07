import {
  getConversationMessages as getConversationMessagesService,
  sendMessage as sendMessageService,
  updateMessage as updateMessageService,
  deleteMessage as deleteMessageService,
  type CreateMessageInput,
  type UpdateMessageInput,
} from "@/server/services/messages";

import { markConversationAsRead as markConversationAsReadService } from "@/server/services/conversations";

import { getCurrentUser } from "@/server/auth/get-current-user";
import { AppError } from "@/server/errors/app-error";

export class MessageController {
  private async requireAuthenticatedUser() {
    const user = await getCurrentUser();

    if (!user) {
      throw new AppError("Authentication is required.", "UNAUTHORIZED", 401);
    }

    return user;
  }

  /**
   * Retrieve messages from a conversation.
   */
  async getConversationMessages(
    conversationId: string,
    options: {
      limit?: number;
      offset?: number;
    } = {},
  ) {
    const user = await this.requireAuthenticatedUser();

    return getConversationMessagesService(user.id, conversationId, options);
  }

  /**
   * Send a text or image message.
   */
  async sendMessage(conversationId: string, input: CreateMessageInput) {
    const user = await this.requireAuthenticatedUser();

    return sendMessageService(user.id, conversationId, input);
  }

  /**
   * Edit a message owned by the current user.
   */
  async updateMessage(messageId: string, input: UpdateMessageInput) {
    const user = await this.requireAuthenticatedUser();

    return updateMessageService(user.id, messageId, input);
  }

  /**
   * Delete a message owned by the current user.
   */
  async deleteMessage(messageId: string) {
    const user = await this.requireAuthenticatedUser();

    return deleteMessageService(user.id, messageId);
  }

  /**
   * Mark the conversation as read for the current user.
   */
  async markConversationAsRead(conversationId: string) {
    const user = await this.requireAuthenticatedUser();

    return markConversationAsReadService(user.id, conversationId);
  }
}

export const messageController = new MessageController();
