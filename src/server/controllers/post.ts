import "server-only";

import { getCurrentUser } from "@/server/auth/get-current-user";
import { AppError } from "@/server/errors/app-error";
import {
  createPost,
  getOwnPosts,
  deletePost as deletePostService,
  updatePost as updatePostService,
  type UpdatePostInput,
} from "@/server/services/posts";

type GetOwnPostsOptions = {
  limit?: number;
  offset?: number;
};

type CreatePostInput = {
  content?: string | null;
  postType: "text" | "image" | "mixed";
  visibility?: "public" | "followers";
  media?: {
    storagePath: string;
    mediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif";
    displayOrder?: number;
  }[];
};

export class PostController {
  async getOwnPosts(options: GetOwnPostsOptions = {}) {
    const user = await this.requireAuthenticatedUser();

    return getOwnPosts(user.id, options);
  }

  async createPost(input: CreatePostInput) {
    const user = await this.requireAuthenticatedUser();

    return createPost(user.id, input);
  }

  private async requireAuthenticatedUser() {
    const user = await getCurrentUser();

    if (!user) {
      throw new AppError("Authentication is required.", "UNAUTHORIZED", 401);
    }

    return user;
  }

  async updatePost(postId: string, input: UpdatePostInput) {
    const user = await this.requireAuthenticatedUser();

    return updatePostService(user.id, postId, input);
  }

  async deletePost(postId: string) {
    const user = await this.requireAuthenticatedUser();

    return deletePostService(user.id, postId);
  }
}

export const postController = new PostController();
