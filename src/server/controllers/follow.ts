import {
  followUser as followUserService,
  unfollowUser as unfollowUserService,
  getFollowers as getFollowersService,
  getFollowing as getFollowingService,
  getFollowCounts as getFollowCountsService,
  isFollowing as isFollowingService,
} from "@/server/services/follows";

import { getProfileByUsername } from "@/server/services/profiles";
import { getCurrentUser } from "@/server/auth/get-current-user";
import { AppError } from "@/server/errors/app-error";

export class FollowController {
  // ---------------------------------------------------------------------------
  // Authentication
  // ---------------------------------------------------------------------------

  private async requireAuthenticatedUser() {
    const user = await getCurrentUser();

    if (!user) {
      throw new AppError("Authentication is required.", "UNAUTHORIZED", 401);
    }

    return user;
  }

  // ---------------------------------------------------------------------------
  // Resolve target profile
  // ---------------------------------------------------------------------------

  private async resolveTargetProfile(username: string) {
    const profile = await getProfileByUsername(username);

    if (!profile) {
      throw new AppError("User not found.", "USER_NOT_FOUND", 404);
    }

    return profile;
  }

  // ---------------------------------------------------------------------------
  // Follow and unfollow
  // ---------------------------------------------------------------------------

  async follow(username: string) {
    const user = await this.requireAuthenticatedUser();
    const target = await this.resolveTargetProfile(username);

    return followUserService(user.id, target.id);
  }

  async unfollow(username: string) {
    const user = await this.requireAuthenticatedUser();
    const target = await this.resolveTargetProfile(username);

    return unfollowUserService(user.id, target.id);
  }

  // ---------------------------------------------------------------------------
  // Followers and following lists
  // ---------------------------------------------------------------------------

  async getFollowers(username: string, limit = 50, offset = 0) {
    await this.requireAuthenticatedUser();

    const target = await this.resolveTargetProfile(username);

    return getFollowersService(target.id, limit, offset);
  }

  async getFollowing(username: string, limit = 50, offset = 0) {
    await this.requireAuthenticatedUser();

    const target = await this.resolveTargetProfile(username);

    return getFollowingService(target.id, limit, offset);
  }

  // ---------------------------------------------------------------------------
  // Relationship state
  // ---------------------------------------------------------------------------

  async getRelationship(username: string) {
    const user = await this.requireAuthenticatedUser();
    const target = await this.resolveTargetProfile(username);

    const [isFollowing, followsYou, counts] = await Promise.all([
      isFollowingService(user.id, target.id),
      isFollowingService(target.id, user.id),
      getFollowCountsService(target.id),
    ]);

    return {
      isFollowing,
      followsYou,
      counts,
    };
  }
}

export const followController = new FollowController();
