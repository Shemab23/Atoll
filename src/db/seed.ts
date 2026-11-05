import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env" });
config();

// ======================================================
// 1. CONFIGURATION
// ======================================================

const SEED_CONFIG = {
  users: 8,
  posts: 16,
  comments: 20,
  conversations: 4,
  messagesPerConversation: 4,
};

const MOCK_USERS = [
  {
    username: "alice_dev",
    displayName: "Alice Morgan",
    dateOfBirth: "1999-04-12",
    bio: "Building things, learning every day, and sharing the journey.",
    country: "Rwanda",
    city: "Kigali",
    avatarSeed: "alice",
  },
  {
    username: "bob_designs",
    displayName: "Bob Carter",
    dateOfBirth: "1998-08-21",
    bio: "Designer who believes the little details make the difference.",
    country: "Rwanda",
    city: "Kigali",
    avatarSeed: "bob",
  },
  {
    username: "charlie_writes",
    displayName: "Charlie James",
    dateOfBirth: "2000-02-15",
    bio: "Writing, reading, and collecting stories from everyday life.",
    country: "Uganda",
    city: "Kampala",
    avatarSeed: "charlie",
  },
  {
    username: "david_creates",
    displayName: "David Lewis",
    dateOfBirth: "1997-11-03",
    bio: "Developer by day. Curious about almost everything.",
    country: "Kenya",
    city: "Nairobi",
    avatarSeed: "david",
  },
  {
    username: "emma_explores",
    displayName: "Emma Wilson",
    dateOfBirth: "2001-06-18",
    bio: "Finding new places, trying new things, and taking photos.",
    country: "Rwanda",
    city: "Musanze",
    avatarSeed: "emma",
  },
  {
    username: "frank_music",
    displayName: "Frank Miller",
    dateOfBirth: "1999-09-27",
    bio: "Music, good conversations, and creative experiments.",
    country: "Tanzania",
    city: "Dar es Salaam",
    avatarSeed: "frank",
  },
  {
    username: "grace_reads",
    displayName: "Grace Taylor",
    dateOfBirth: "2002-01-09",
    bio: "Books, coffee, and conversations that go beyond small talk.",
    country: "Rwanda",
    city: "Huye",
    avatarSeed: "grace",
  },
  {
    username: "henry_travels",
    displayName: "Henry Adams",
    dateOfBirth: "1998-12-05",
    bio: "Exploring places and learning from the people I meet.",
    country: "Kenya",
    city: "Mombasa",
    avatarSeed: "henry",
  },
];

const MOCK_POSTS = [
  {
    author: 0,
    content:
      "Finally finished a project I've been working on for weeks. Small progress is still progress.",
    visibility: "public" as const,
  },
  {
    author: 1,
    content:
      "A little inspiration from today's design session. Sometimes the simplest ideas are the best.",
    visibility: "public" as const,
  },
  {
    author: 2,
    content:
      "I've been thinking about how much our everyday experiences shape the stories we tell.",
    visibility: "public" as const,
  },
  {
    author: 3,
    content: "A quick look at what I've been building lately.",
    visibility: "public" as const,
  },
  {
    author: 4,
    content:
      "Took a little time away from the screen today. I think we all need that sometimes.",
    visibility: "public" as const,
  },
  {
    author: 5,
    content:
      "Found a song that has been on repeat all morning. Music really changes the mood.",
    visibility: "public" as const,
  },
  {
    author: 6,
    content:
      "Finished another book. I wish I could share the feeling of reaching a really good ending.",
    visibility: "public" as const,
  },
  {
    author: 7,
    content: "New places always remind me how much there is still to discover.",
    visibility: "public" as const,
  },
  {
    author: 0,
    content:
      "One thing I've learned recently: don't wait until everything is perfect to start.",
    visibility: "followers" as const,
  },
  {
    author: 1,
    content:
      "Experimenting with a new visual direction. Still a work in progress.",
    visibility: "public" as const,
  },
  {
    author: 2,
    content: "What's one small thing that made your day better today?",
    visibility: "public" as const,
  },
  {
    author: 3,
    content: "A reminder to keep learning, even when the progress feels slow.",
    visibility: "public" as const,
  },
  {
    author: 4,
    content: "Weekend moments worth keeping.",
    visibility: "public" as const,
  },
  {
    author: 5,
    content: "Working on something creative. I'll share more when it's ready.",
    visibility: "followers" as const,
  },
  {
    author: 6,
    content: "A good conversation can make an ordinary day memorable.",
    visibility: "public" as const,
  },
  {
    author: 7,
    content: "Somewhere new, with a little more time to explore.",
    visibility: "public" as const,
  },
];

const MOCK_COMMENTS = [
  "This is really nice!",
  "I completely agree with this.",
  "Keep going. Looking forward to seeing more.",
  "I needed this reminder today.",
  "That looks amazing!",
  "How did you get started with this?",
  "I like the way you explained this.",
  "This is worth thinking about.",
  "Thanks for sharing this!",
  "Would love to hear more about it.",
  "Small steps really do add up.",
  "This made me smile.",
  "I have had a similar experience.",
  "Beautifully put.",
  "Definitely something to try.",
  "Love seeing people share their progress.",
  "What inspired you to do this?",
  "I would love to learn more.",
  "That is a good perspective.",
  "Keep sharing these moments.",
];

const MOCK_MESSAGES = [
  "Hey! How have you been?",
  "I'm doing well. How about you?",
  "Pretty good! I've been working on a few things lately.",
  "That sounds interesting. What are you working on?",
  "Mostly creative projects and learning some new skills.",
  "Nice! We should exchange ideas sometime.",
  "Absolutely. I'd enjoy that.",
  "How has your week been so far?",
];

// ======================================================
// 2. ENVIRONMENT AND VALIDATION
// ======================================================

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function validateConfiguration() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Seeding is disabled in production.");
  }

  if (process.env.SEED_ENABLED !== "true") {
    throw new Error(
      "Seeding is disabled. Set SEED_ENABLED=true in .env.local to continue.",
    );
  }

  if (SEED_CONFIG.users !== MOCK_USERS.length) {
    throw new Error("SEED_CONFIG.users must match the number of MOCK_USERS.");
  }

  if (SEED_CONFIG.users < 4) {
    throw new Error("At least four mock users are required.");
  }

  if (SEED_CONFIG.posts > MOCK_POSTS.length || SEED_CONFIG.posts < 1) {
    throw new Error("Invalid SEED_CONFIG.posts value.");
  }

  if (SEED_CONFIG.comments > MOCK_COMMENTS.length || SEED_CONFIG.comments < 1) {
    throw new Error("Invalid SEED_CONFIG.comments value.");
  }

  if (SEED_CONFIG.conversations > Math.floor(SEED_CONFIG.users / 2)) {
    throw new Error(
      "There are not enough mock users for the configured conversations.",
    );
  }

  if (SEED_CONFIG.messagesPerConversation < 1) {
    throw new Error("Each conversation must have at least one message.");
  }

  getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");
  getRequiredEnv("SEED_USER_PASSWORD");
  getRequiredEnv("ATOLL_OWNER_USER_ID");
  getRequiredEnv("ATOLL_OWNER_USERNAME");
  getRequiredEnv("ATOLL_OWNER_DISPLAY_NAME");
  getRequiredEnv("ATOLL_OWNER_DATE_OF_BIRTH");
}

// ======================================================
// 3. HELPERS
// ======================================================

function getAvatarUrl(seed: string) {
  return `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
}

function getMockEmail(username: string) {
  return `${username}@atoll.test`;
}

function getMockPassword() {
  const password = getRequiredEnv("SEED_USER_PASSWORD");

  if (password.length < 8) {
    throw new Error("SEED_USER_PASSWORD must contain at least 8 characters.");
  }

  return password;
}

// ======================================================
// 4. SUPABASE AUTH USERS
// ======================================================

async function findAuthUserByEmail(
  supabase: ReturnType<typeof createClient>,
  email: string,
) {
  const perPage = 100;

  for (let page = 1; page <= 20; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) {
      throw new Error(`Could not list Supabase Auth users: ${error.message}`);
    }

    const existingUser = data.users.find(
      (user) => user.email?.toLowerCase() === email.toLowerCase(),
    );

    if (existingUser) {
      return existingUser;
    }

    if (data.users.length < perPage) {
      break;
    }
  }

  return null;
}

async function getOrCreateMockAuthUser(
  supabase: ReturnType<typeof createClient>,
  user: (typeof MOCK_USERS)[number],
) {
  const email = getMockEmail(user.username);

  const existingUser = await findAuthUserByEmail(supabase, email);

  if (existingUser) {
    console.log(`  Reusing Auth account: ${email}`);
    return existingUser;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: getMockPassword(),
    email_confirm: true,
    user_metadata: {
      username: user.username,
      display_name: user.displayName,
      is_seed_account: true,
    },
  });

  if (error || !data.user) {
    throw new Error(
      `Could not create Auth account ${email}: ${error?.message}`,
    );
  }

  console.log(`  Created Auth account: ${email}`);

  return data.user;
}

// ======================================================
// 5. MAIN SEED
// ======================================================

async function seed() {
  validateConfiguration();

  // Load database only after dotenv has loaded .env.local.
  const { db } = await import("./index");

  try {
    const supabase: ReturnType<typeof createClient> = createClient(
      getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
      getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );

    console.log("\nStarting Atoll development seed...\n");

    // --------------------------------------------------
    // A. SAFETY CHECK
    // --------------------------------------------------

    const existingProfiles = await db
      .select({ id: (await import("./schema/profiles")).profiles.id })
      .from((await import("./schema/profiles")).profiles)
      .limit(1);

    if (existingProfiles.length > 0) {
      throw new Error(
        "Application profiles already exist. Run the development cleanup first, then retry the seed.",
      );
    }

    // --------------------------------------------------
    // B. GET THE REAL OWNER AUTH ACCOUNT
    // --------------------------------------------------

    console.log("Checking owner Auth account...");

    const ownerId = getRequiredEnv("ATOLL_OWNER_USER_ID");

    const { data: ownerResult, error: ownerError } =
      await supabase.auth.admin.getUserById(ownerId);

    if (ownerError || !ownerResult.user) {
      throw new Error(
        `Owner Auth account not found: ${ownerError?.message ?? "Check ATOLL_OWNER_USER_ID."}`,
      );
    }

    const owner = {
      id: ownerResult.user.id,
      username: getRequiredEnv("ATOLL_OWNER_USERNAME").toLowerCase(),
      displayName: getRequiredEnv("ATOLL_OWNER_DISPLAY_NAME"),
      dateOfBirth: getRequiredEnv("ATOLL_OWNER_DATE_OF_BIRTH"),
      bio: "Building and growing the Atoll community.",
      country: "Rwanda",
      city: "Kigali",
      avatarUrl: null as string | null,
    };

    // --------------------------------------------------
    // C. CREATE / REUSE MOCK AUTH ACCOUNTS
    // --------------------------------------------------

    console.log("\nPreparing fictional test accounts...");

    const mockAuthUsers = [];

    for (const mockUser of MOCK_USERS.slice(0, SEED_CONFIG.users)) {
      const authUser = await getOrCreateMockAuthUser(supabase, mockUser);

      mockAuthUsers.push({
        id: authUser.id,
        ...mockUser,
      });
    }

    // Owner is included as a real profile.
    // Mock users are included as fictional profiles.
    const users = [
      owner,
      ...mockAuthUsers.map((user) => ({
        ...user,
        avatarUrl: getAvatarUrl(user.avatarSeed),
      })),
    ];

    console.log(`\nPrepared ${users.length} application profiles.`);

    // --------------------------------------------------
    // D. INSERT APPLICATION DATA
    // --------------------------------------------------

    console.log("\nInserting application data...");

    const summary = await db.transaction(async (tx) => {
      const { profiles, profileSettings } = await import("./schema/profiles");
      const { posts } = await import("./schema/posts");
      const { comments, follows, reactions } = await import("./schema/actions");
      const { conversations, conversationMembers } =
        await import("./schema/conversation");
      const { messages } = await import("./schema/messages");
      const { reports, blocks } = await import("./schema/reaction");
      const { moderationActions } = await import("./schema/moderation");
      const { notifications } = await import("./schema/notifications");
      const { adminUsers } = await import("./schema/adminUser");

      // PROFILES
      await tx.insert(profiles).values(
        users.map((user) => ({
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          dateOfBirth: user.dateOfBirth,
          bio: user.bio,
          avatarUrl: user.avatarUrl,
          coverUrl: null,
          country: user.country,
          city: user.city,
          accountStatus: "active" as const,
        })),
      );

      await tx.insert(profileSettings).values(
        users.map((user) => ({
          userId: user.id,
          isDiscoverable: true,
          showOnlineStatus: true,
          allowMessages: "everyone" as const,
          notificationPreferences: {},
        })),
      );

      console.log(`  Profiles: ${users.length}`);

      // ADMIN ROLES
      const moderator = users[4];

      await tx.insert(adminUsers).values([
        {
          userId: owner.id,
          role: "owner",
          grantedBy: null,
        },
        {
          userId: moderator.id,
          role: "moderator",
          grantedBy: owner.id,
        },
      ]);

      console.log("  Admin roles: 1 owner, 1 moderator");

      // POSTS
      // Seed text-only posts until real Storage objects exist.
      const selectedPosts = MOCK_POSTS.slice(0, SEED_CONFIG.posts);
      const postIds: string[] = [];
      const postAuthors: string[] = [];

      for (const post of selectedPosts) {
        const author = users[post.author + 1];

        const [createdPost] = await tx
          .insert(posts)
          .values({
            authorId: author.id,
            content: post.content,
            postType: "text",
            visibility: post.visibility,
            status: "active",
          })
          .returning({ id: posts.id });

        postIds.push(createdPost.id);
        postAuthors.push(author.id);
      }

      console.log(`  Posts: ${postIds.length}`);

      // COMMENTS
      const commentIds: string[] = [];
      const commentAuthors: string[] = [];

      for (let i = 0; i < SEED_CONFIG.comments; i++) {
        const author = users[(i % SEED_CONFIG.users) + 1];
        const postId = postIds[i % postIds.length];

        const [createdComment] = await tx
          .insert(comments)
          .values({
            postId,
            authorId: author.id,
            content: MOCK_COMMENTS[i],
            status: "active",
          })
          .returning({ id: comments.id });

        commentIds.push(createdComment.id);
        commentAuthors.push(author.id);
      }

      console.log(`  Comments: ${commentIds.length}`);

      // REACTIONS
      const reactionTypes = ["like", "love", "support", "laugh"];

      for (let i = 0; i < postIds.length; i++) {
        for (let j = 1; j <= 3; j++) {
          const user = users[((i + j) % SEED_CONFIG.users) + 1];

          await tx
            .insert(reactions)
            .values({
              postId: postIds[i],
              userId: user.id,
              reactionType: reactionTypes[(i + j) % reactionTypes.length],
            })
            .onConflictDoNothing();
        }
      }

      console.log("  Reactions: created");

      // FOLLOWS
      for (let i = 0; i < users.length; i++) {
        for (let offset = 1; offset <= 2; offset++) {
          const follower = users[i];
          const following = users[(i + offset) % users.length];

          if (follower.id === following.id) continue;

          await tx
            .insert(follows)
            .values({
              followerId: follower.id,
              followingId: following.id,
            })
            .onConflictDoNothing();
        }
      }

      console.log("  Follows: created");

      // CONVERSATIONS AND MESSAGES
      const conversationIds: string[] = [];
      const messageRecords: {
        id: string;
        senderId: string;
      }[] = [];

      for (let i = 0; i < SEED_CONFIG.conversations; i++) {
        const creator = users[1 + i * 2];
        const companion = users[2 + i * 2];

        const [conversation] = await tx
          .insert(conversations)
          .values({
            conversationType: "direct",
            createdBy: creator.id,
          })
          .returning({ id: conversations.id });

        conversationIds.push(conversation.id);

        await tx.insert(conversationMembers).values([
          {
            conversationId: conversation.id,
            userId: creator.id,
            isActive: true,
          },
          {
            conversationId: conversation.id,
            userId: companion.id,
            isActive: true,
          },
        ]);

        for (let j = 0; j < SEED_CONFIG.messagesPerConversation; j++) {
          const sender = j % 2 === 0 ? creator : companion;

          const [message] = await tx
            .insert(messages)
            .values({
              conversationId: conversation.id,
              senderId: sender.id,
              content: MOCK_MESSAGES[j % MOCK_MESSAGES.length],
              messageType: "text",
            })
            .returning({ id: messages.id });

          messageRecords.push({
            id: message.id,
            senderId: sender.id,
          });
        }
      }

      console.log(`  Conversations: ${conversationIds.length}`);
      console.log(`  Messages: ${messageRecords.length}`);

      // BLOCKS
      await tx
        .insert(blocks)
        .values({
          blockerId: owner.id,
          blockedId: users[users.length - 1].id,
        })
        .onConflictDoNothing();

      console.log("  Blocks: 1");

      // REPORTS
      // The reported user must actually own the reported content.
      const [postReport] = await tx
        .insert(reports)
        .values({
          reporterId: owner.id,
          reportedUserId: postAuthors[0],
          postId: postIds[0],
          reason: "spam",
          description:
            "This post contains repeated unrelated promotional links.",
          status: "pending",
        })
        .returning({ id: reports.id });

      const [commentReport] = await tx
        .insert(reports)
        .values({
          reporterId: users[2].id,
          reportedUserId: commentAuthors[0],
          commentId: commentIds[0],
          reason: "harassment",
          description: "This comment contains inappropriate language.",
          status: "reviewing",
        })
        .returning({ id: reports.id });

      const reportedMessage = messageRecords[0];

      const [messageReport] = await tx
        .insert(reports)
        .values({
          reporterId: users[3].id,
          reportedUserId: reportedMessage.senderId,
          messageId: reportedMessage.id,
          reason: "spam",
          description:
            "This message contains repeated unwanted promotional content.",
          status: "pending",
        })
        .returning({ id: reports.id });

      console.log("  Reports: 3");

      // MODERATION HISTORY
      // All actions are attributed to the seeded moderator.
      await tx.insert(moderationActions).values([
        {
          adminId: moderator.id,
          targetUserId: postAuthors[0],
          reportId: postReport.id,
          actionType: "warning",
          reason: "A warning was issued after reviewing a reported post.",
          expiresAt: null,
        },
        {
          adminId: moderator.id,
          targetUserId: commentAuthors[0],
          reportId: commentReport.id,
          actionType: "hide",
          reason: "The reported comment was hidden pending further review.",
          expiresAt: null,
        },
        {
          adminId: moderator.id,
          targetUserId: reportedMessage.senderId,
          reportId: messageReport.id,
          actionType: "warning",
          reason: "A warning was issued after reviewing a reported message.",
          expiresAt: null,
        },
      ]);

      console.log("  Moderation actions: 3");

      // NOTIFICATIONS
      await tx.insert(notifications).values([
        {
          recipientId: postAuthors[0],
          actorId: owner.id,
          notificationType: "post_reaction",
          referenceId: postIds[0],
          referenceType: "posts",
          isRead: false,
        },
        {
          recipientId: postAuthors[0],
          actorId: commentAuthors[0],
          notificationType: "post_comment",
          referenceId: postIds[0],
          referenceType: "posts",
          isRead: false,
        },
        {
          recipientId: users[2].id,
          actorId: users[3].id,
          notificationType: "new_follower",
          referenceId: users[2].id,
          referenceType: "profiles",
          isRead: true,
        },
        {
          recipientId: users[2].id,
          actorId: users[1].id,
          notificationType: "new_message",
          referenceId: conversationIds[0],
          referenceType: "conversations",
          isRead: false,
        },
      ]);

      console.log("  Notifications: 4");

      return {
        users: users.length,
        posts: postIds.length,
        comments: commentIds.length,
        conversations: conversationIds.length,
        messages: messageRecords.length,
      };
    });

    // --------------------------------------------------
    // E. SUMMARY
    // --------------------------------------------------

    console.log("\n========================================");
    console.log("        ATOLL SEED COMPLETED");
    console.log("========================================");
    console.log(`Profiles:       ${summary.users}`);
    console.log(`Posts:          ${summary.posts}`);
    console.log(`Comments:       ${summary.comments}`);
    console.log(`Conversations:  ${summary.conversations}`);
    console.log(`Messages:       ${summary.messages}`);
    console.log("Admin roles:    1 owner, 1 moderator");
    console.log("Reports:        3");
    console.log("Moderation:     3");
    console.log("Notifications:  4");
    console.log("========================================\n");
  } finally {
    await db.$client.end();
  }
}

// ======================================================
// 6. EXECUTION
// ======================================================

seed().catch((error) => {
  console.error("\nAtoll seed failed:", error);
  process.exitCode = 1;
});
