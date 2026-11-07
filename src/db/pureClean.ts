import "dotenv/config";

import { createClient } from "@supabase/supabase-js";
import { ne } from "drizzle-orm";

import { db } from "./index";

import { profiles, profileSettings } from "./schema/profiles";
import { posts, postMedia } from "./schema/posts";
import { comments, follows, reactions } from "./schema/actions";
import { conversations, conversationMembers } from "./schema/conversation";
import { messages } from "./schema/messages";
import { reports, blocks } from "./schema/reaction";
import { moderationActions } from "./schema/moderation";
import { notifications } from "./schema/notifications";
import { adminUsers } from "./schema/adminUser";

// --------------------------------------------------
// Environment variables
// --------------------------------------------------

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

// --------------------------------------------------
// Supabase Auth cleanup
// --------------------------------------------------

async function deleteOtherAuthUsers(
  supabase: ReturnType<typeof createClient>,
  ownerId: string,
) {
  console.log("\nChecking Supabase Auth accounts...");

  const userIds: string[] = [];
  const perPage = 100;

  for (let page = 1; ; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) {
      throw new Error(`Could not list Supabase Auth users: ${error.message}`);
    }

    userIds.push(...data.users.map((user) => user.id));

    if (data.users.length < perPage) {
      break;
    }
  }

  // Never proceed if the owner cannot be found.
  if (!userIds.includes(ownerId)) {
    throw new Error(
      "OWNER SAFETY CHECK FAILED: ATOLL_OWNER_USER_ID was not found in Supabase Auth. Cleanup stopped.",
    );
  }

  const usersToDelete = userIds.filter((id) => id !== ownerId);

  console.log(`Found ${userIds.length} Auth accounts.`);
  console.log("Owner account will be preserved.");
  console.log(`Other accounts to delete: ${usersToDelete.length}`);

  for (const userId of usersToDelete) {
    const { error } = await supabase.auth.admin.deleteUser(userId);

    if (error) {
      throw new Error(
        `Could not delete Auth account ${userId}: ${error.message}`,
      );
    }
  }

  console.log("Other Supabase Auth accounts deleted.");
}

// --------------------------------------------------
// Main cleanup
// --------------------------------------------------

async function clean() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Cleanup is disabled in production.");
  }

  let cleanupStarted = false;

  try {
    const ownerId = getRequiredEnv("ATOLL_OWNER_USER_ID");

    const supabaseUrl = getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL");
    const serviceRoleKey = getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");

    const supabase: ReturnType<typeof createClient> = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );

    console.log("====================================");
    console.log("Starting Atoll development cleanup");
    console.log("====================================");

    console.log("\nOwner account:");
    console.log(ownerId);

    // Verify the owner exists before deleting any application data.
    const { data: ownerResult, error: ownerError } =
      await supabase.auth.admin.getUserById(ownerId);

    if (ownerError || !ownerResult.user) {
      throw new Error("Owner account could not be verified. Cleanup stopped.");
    }

    console.log("\nOwner verification successful.");

    cleanupStarted = true;

    // ----------------------------------------------
    // Clear application data
    // ----------------------------------------------

    console.log("\nDeleting application data...");

    // Notifications and moderation
    await db.delete(notifications);
    await db.delete(moderationActions);

    // Reports and blocks
    await db.delete(blocks);
    await db.delete(reports);

    // Messages and conversations
    await db.delete(messages);
    await db.delete(conversationMembers);
    await db.delete(conversations);

    // Social interactions
    await db.delete(follows);
    await db.delete(reactions);
    await db.delete(comments);

    // Posts and media
    await db.delete(postMedia);
    await db.delete(posts);

    // Remove other users' admin records,
    // but preserve the owner's admin role.
    await db.delete(adminUsers).where(ne(adminUsers.userId, ownerId));

    // Remove other users' settings and profiles,
    // but preserve the owner's records.
    await db.delete(profileSettings).where(ne(profileSettings.userId, ownerId));

    await db.delete(profiles).where(ne(profiles.id, ownerId));

    console.log("Application data cleanup completed.");

    // ----------------------------------------------
    // Delete other Supabase Auth accounts
    // ----------------------------------------------

    await deleteOtherAuthUsers(supabase, ownerId);

    console.log("\n====================================");
    console.log("Atoll cleanup completed successfully.");
    console.log("====================================");

    console.log("\nPreserved:");
    console.log("- Owner Supabase Auth account");
    console.log("- Owner Atoll profile");
    console.log("- Owner profile settings");
    console.log("- Owner admin role");

    console.log("\nDeleted:");
    console.log("- Other Supabase Auth accounts");
    console.log("- Development posts and media");
    console.log("- Comments and reactions");
    console.log("- Follows and blocks");
    console.log("- Messages and conversations");
    console.log("- Reports and moderation records");
    console.log("- Notifications");
    console.log("- Other users' profiles and settings");
  } catch (error) {
    console.error("\nCLEANUP FAILED:");

    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error(error);
    }

    if (cleanupStarted) {
      console.error(
        "\nSome cleanup operations may already have completed. Review the database before retrying.",
      );
    }

    process.exitCode = 1;
  } finally {
    await db.$client.end();
  }
}

void clean();
