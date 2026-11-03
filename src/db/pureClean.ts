import "dotenv/config";
import { db } from "./index";
import { profiles, profileSettings, authUsers } from "./schema/profiles";
import { posts, postMedia } from "./schema/posts";
import { comments, follows, reactions } from "./schema/actions";
import { conversations, conversationMembers } from "./schema/conversation";
import { messages } from "./schema/messages";
import { reports, blocks } from "./schema/reaction";
import { moderationActions } from "./schema/moderation";
import { notifications } from "./schema/notifications";

async function Clean() {
  console.log("⏳ Initializing database destructive wipe sequence...");

  // ==========================================
  // 1. DESTRUCTIVE DELETION IN REVERSE ORDER
  // ==========================================
  await db.delete(notifications);
  await db.delete(moderationActions);
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
  await db.delete(authUsers);
}

Clean()
  .catch((error) => {
    console.error("❌ Fatal error occurred during cleaning execution:", error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
