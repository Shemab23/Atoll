import "server-only";

import { getCurrentUser } from "@/server/auth/get-current-user";
import { createClient } from "@/lib/supabase/server";
import { AppError } from "@/server/errors/app-error";
import { getSupabaseConfig } from "@/lib/supabase/env";
import {
  getOwnProfileById,
  getProfileByUsername,
  updateProfile,
  getProfileSettings,
  updateProfileSettings,
  softDeleteProfile,
} from "@/server/services/profiles";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

type UpdateProfileInput = {
  username?: string;
  displayName?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  country?: string | null;
  city?: string | null;
};

type ProfileSettingsUpdateInput = {
  isDiscoverable?: boolean;
  showOnlineStatus?: boolean;
  allowMessages?: "everyone" | "followers" | "nobody";
  notificationPreferences?: Record<string, unknown>;
};

export class ProfileController {
  async getCurrentProfile() {
    const user = await this.requireAuthenticatedUser();

    const profile = await getOwnProfileById(user.id);

    if (!profile) {
      throw new AppError(
        "Your account exists, but your Atoll profile could not be found.",
        "PROFILE_INTEGRITY_ERROR",
        500,
      );
    }

    return profile;
  }

  async getPublicProfile(username: string) {
    const profile = await getProfileByUsername(username);

    if (!profile) {
      throw new AppError(
        "The requested profile could not be found.",
        "PROFILE_NOT_FOUND",
        404,
      );
    }

    return profile;
  }

  async updateCurrentProfile(input: UpdateProfileInput) {
    const user = await this.requireAuthenticatedUser();

    return updateProfile(user.id, input);
  }

  private async requireAuthenticatedUser() {
    const user = await getCurrentUser();

    if (!user) {
      throw new AppError("Authentication is required.", "UNAUTHORIZED", 401);
    }

    return user;
  }

  async getCurrentSettings() {
    const user = await this.requireAuthenticatedUser();

    return getProfileSettings(user.id);
  }

  async updateCurrentSettings(input: ProfileSettingsUpdateInput) {
    const user = await this.requireAuthenticatedUser();

    return updateProfileSettings(user.id, input);
  }

  async deleteCurrentAccount(currentPassword: string) {
    const user = await this.requireAuthenticatedUser();

    const { url, anonKey } = getSupabaseConfig();
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceRoleKey) {
      throw new AppError(
        "Account deletion is not configured.",
        "ACCOUNT_DELETION_NOT_CONFIGURED",
        500,
      );
    }

    const adminClient = createSupabaseClient(url, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Allow a retry if the database cleanup succeeded but a previous
    // Auth administration request failed.
    const alreadyRetired = user.app_metadata?.account_deleted === true;

    if (!alreadyRetired) {
      if (!user.email) {
        throw new AppError(
          "Your account does not have an email address.",
          "ACCOUNT_EMAIL_MISSING",
          400,
        );
      }

      // Verify the current password without changing the user's session.
      const verificationClient = createSupabaseClient(url, anonKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });

      const { error: verificationError } =
        await verificationClient.auth.signInWithPassword({
          email: user.email,
          password: currentPassword,
        });

      if (verificationError) {
        throw new AppError(
          "The current password is incorrect.",
          "ACCOUNT_OWNERSHIP_VERIFICATION_FAILED",
          403,
        );
      }
    }

    // First retire the application data. This operation is transactional.
    // If it fails, the Supabase Auth identity is not modified.
    await softDeleteProfile(user.id);

    // Release the original email for a future signup without deleting
    // the Auth user and triggering database foreign-key cascades.
    const reservedEmail = `deleted+${user.id.replace(/-/g, "")}@accounts.atoll.invalid`;

    const { error: authUpdateError } =
      await adminClient.auth.admin.updateUserById(user.id, {
        email: reservedEmail,
        email_confirm: true,
        ban_duration: "876000h",
        app_metadata: {
          ...user.app_metadata,
          account_deleted: true,
        },
      });

    if (authUpdateError) {
      console.error("Account retirement: Supabase Auth update failed.", {
        userId: user.id,
        message: authUpdateError.message,
      });

      throw new AppError(
        "Your application data was retired, but account sign-in could not be disabled. Please retry account deletion.",
        "ACCOUNT_AUTH_RETIREMENT_FAILED",
        500,
      );
    }

    // Invalidate all refresh-token sessions, then clear this browser session.
    const supabase = await createClient();
    const { error: signOutError } = await supabase.auth.signOut({
      scope: "global",
    });

    if (signOutError) {
      // The account is already banned and marked as retired.
      // Still attempt to clear the current browser session.
      await supabase.auth.signOut({ scope: "local" });
    }

    return {
      message: "Your account has been deactivated.",
      accountStatus: "deleted",
    };
  }
}

export const profileController = new ProfileController();
