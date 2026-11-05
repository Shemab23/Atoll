import "dotenv/config";

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

async function clean() {
  console.log("Starting database cleanup...");

  try {
    await db.delete(notifications);
    await db.delete(moderationActions);
    await db.delete(adminUsers);

    await db.delete(blocks);
    await db.delete(reports);

    await db.delete(messages);
    await db.delete(conversationMembers);
    await db.delete(conversations);

    await db.delete(follows);
    await db.delete(reactions);
    await db.delete(comments);

    await db.delete(postMedia);
    await db.delete(posts);

    await db.delete(profileSettings);
    await db.delete(profiles);

    console.log("Database cleanup completed successfully.");
  } catch (error) {
    console.error("Database cleanup failed:", error);
    process.exitCode = 1;
  } finally {
    await db.$client.end();
  }
}

void clean();
