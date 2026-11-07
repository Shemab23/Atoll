import "server-only";

import { createClient } from "@/lib/supabase/server";
import { AppError } from "@/server/errors/app-error";

type SignupInput = {
  email: string;
  password: string;
  username: string;
  dateOfBirth: string;
  displayName?: string;
};

type LoginInput = {
  email: string;
  password: string;
};

export class AuthController {
  async login(input: LoginInput) {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });

    if (error) {
      if (error.code === "invalid_credentials") {
        throw new AppError(
          "Email or password is incorrect.",
          "INVALID_CREDENTIALS",
          401,
        );
      }

      if (error.code === "email_not_confirmed") {
        throw new AppError(
          "Please confirm your email before signing in.",
          "EMAIL_NOT_CONFIRMED",
          403,
        );
      }

      throw new AppError(
        "Unable to sign in. Please try again.",
        "LOGIN_FAILED",
        400,
      );
    }

    if (!data.user) {
      throw new AppError(
        "Authentication succeeded without returning a user.",
        "AUTHENTICATION_FAILED",
        500,
      );
    }

    return {
      user: {
        id: data.user.id,
        email: data.user.email,
      },
    };
  }

  async signup(input: SignupInput, origin: string) {
    const supabase = await createClient();

    const callbackUrl = new URL("/auth/callback", origin);
    callbackUrl.searchParams.set("next", "/login?confirmed=1");

    const { data, error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: {
          username: input.username.trim().toLowerCase(),
          date_of_birth: input.dateOfBirth,
          display_name: input.displayName?.trim() || null,
        },
        emailRedirectTo: callbackUrl.toString(),
      },
    });

    if (error) {
      throw new AppError(
        "Unable to create your account. Check your details and try again.",
        "SIGNUP_FAILED",
        400,
      );
    }

    if (!data.user) {
      throw new AppError("Signup did not return a user.", "SIGNUP_FAILED", 500);
    }

    return {
      user: {
        id: data.user.id,
        email: data.user.email,
      },
      confirmationRequired: !data.session,
    };
  }

  async logout() {
    const supabase = await createClient();

    const { error } = await supabase.auth.signOut();

    if (error) {
      throw new AppError(
        "Unable to sign out. Please try again.",
        "LOGOUT_FAILED",
        400,
      );
    }

    return {
      message: "Signed out successfully.",
    };
  }

  async forgotPassword(email: string, origin: string) {
    const supabase = await createClient();

    const callbackUrl = new URL("/auth/callback", origin);
    callbackUrl.searchParams.set("next", "/reset-password");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: callbackUrl.toString(),
    });

    if (error) {
      throw new AppError(
        "Unable to process your password reset request.",
        "PASSWORD_RESET_REQUEST_FAILED",
        400,
      );
    }

    // Do not reveal whether an email address has an account.
    return {
      message:
        "If an account exists for that email, a reset link will be sent.",
    };
  }

  async resetPassword(password: string) {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      throw new AppError(
        "Unable to update your password. Your reset session may have expired.",
        "PASSWORD_UPDATE_FAILED",
        400,
      );
    }

    if (!data.user) {
      throw new AppError(
        "Password update did not return a user.",
        "PASSWORD_UPDATE_FAILED",
        500,
      );
    }

    return {
      message: "Password updated successfully.",
    };
  }
}

export const authController = new AuthController();
