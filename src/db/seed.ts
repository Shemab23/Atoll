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

// ======================================================
// 1. SEED CONFIGURATION
// Change these values to control the amount of seed data.
// ======================================================

const SEED_CONFIG = {
  users: 8,
  posts: 16,
  comments: 20,
  conversations: 4,
  messagesPerConversation: 4,

  // Keep true only when seeding a development database.
  // This script does not automatically delete existing data.
  developmentOnly: true,
};

// ======================================================
// 2. MOCK USERS
// All mock users are fictional.
// ======================================================

const MOCK_USERS = [
  {
    id: "e1bc1458-71e4-4d8e-be89-9a74288bbf01",
    username: "alice_dev",
    displayName: "Alice Morgan",
    dateOfBirth: "1999-04-12",
    bio: "Building things, learning every day, and sharing the journey.",
    country: "Rwanda",
    city: "Kigali",
    avatarSeed: "alice",
  },
  {
    id: "e1bc1458-71e4-4d8e-be89-9a74288bbf02",
    username: "bob_designs",
    displayName: "Bob Carter",
    dateOfBirth: "1998-08-21",
    bio: "Designer who believes the little details make the difference.",
    country: "Rwanda",
    city: "Kigali",
    avatarSeed: "bob",
  },
  {
    id: "e1bc1458-71e4-4d8e-be89-9a74288bbf03",
    username: "charlie_writes",
    displayName: "Charlie James",
    dateOfBirth: "2000-02-15",
    bio: "Writing, reading, and collecting stories from everyday life.",
    country: "Uganda",
    city: "Kampala",
    avatarSeed: "charlie",
  },
  {
    id: "e1bc1458-71e4-4d8e-be89-9a74288bbf04",
    username: "david_creates",
    displayName: "David Lewis",
    dateOfBirth: "1997-11-03",
    bio: "Developer by day. Curious about almost everything.",
    country: "Kenya",
    city: "Nairobi",
    avatarSeed: "david",
  },
  {
    id: "e1bc1458-71e4-4d8e-be89-9a74288bbf05",
    username: "emma_explores",
    displayName: "Emma Wilson",
    dateOfBirth: "2001-06-18",
    bio: "Finding new places, trying new things, and taking photos.",
    country: "Rwanda",
    city: "Musanze",
    avatarSeed: "emma",
  },
  {
    id: "e1bc1458-71e4-4d8e-be89-9a74288bbf06",
    username: "frank_music",
    displayName: "Frank Miller",
    dateOfBirth: "1999-09-27",
    bio: "Music, good conversations, and creative experiments.",
    country: "Tanzania",
    city: "Dar es Salaam",
    avatarSeed: "frank",
  },
  {
    id: "e1bc1458-71e4-4d8e-be89-9a74288bbf07",
    username: "grace_reads",
    displayName: "Grace Taylor",
    dateOfBirth: "2002-01-09",
    bio: "Books, coffee, and conversations that go beyond small talk.",
    country: "Rwanda",
    city: "Huye",
    avatarSeed: "grace",
  },
  {
    id: "e1bc1458-71e4-4d8e-be89-9a74288bbf08",
    username: "henry_travels",
    displayName: "Henry Adams",
    dateOfBirth: "1998-12-05",
    bio: "Exploring places and learning from the people I meet.",
    country: "Kenya",
    city: "Mombasa",
    avatarSeed: "henry",
  },
];

// ======================================================
// 3. MOCK POSTS
// Each post has an author index and a type.
// ======================================================

const MOCK_POSTS = [
  {
    author: 0,
    content:
      "Finally finished a project I've been working on for weeks. Small progress is still progress.",
    type: "text" as const,
    visibility: "public" as const,
  },
  {
    author: 1,
    content:
      "A little inspiration from today's design session. Sometimes the simplest ideas are the best.",
    type: "image" as const,
    visibility: "public" as const,
  },
  {
    author: 2,
    content:
      "I've been thinking about how much our everyday experiences shape the stories we tell.",
    type: "text" as const,
    visibility: "public" as const,
  },
  {
    author: 3,
    content: "A quick look at what I've been building lately.",
    type: "mixed" as const,
    visibility: "public" as const,
  },
  {
    author: 4,
    content:
      "Took a little time away from the screen today. I think we all need that sometimes.",
    type: "image" as const,
    visibility: "public" as const,
  },
  {
    author: 5,
    content:
      "Found a song that has been on repeat all morning. Music really changes the mood.",
    type: "text" as const,
    visibility: "public" as const,
  },
  {
    author: 6,
    content:
      "Finished another book. I wish I could share the feeling of reaching a really good ending.",
    type: "text" as const,
    visibility: "public" as const,
  },
  {
    author: 7,
    content: "New places always remind me how much there is still to discover.",
    type: "image" as const,
    visibility: "public" as const,
  },
  {
    author: 0,
    content:
      "One thing I've learned recently: don't wait until everything is perfect to start.",
    type: "text" as const,
    visibility: "followers" as const,
  },
  {
    author: 1,
    content:
      "Experimenting with a new visual direction. Still a work in progress.",
    type: "mixed" as const,
    visibility: "public" as const,
  },
  {
    author: 2,
    content: "What's one small thing that made your day better today?",
    type: "text" as const,
    visibility: "public" as const,
  },
  {
    author: 3,
    content: "A reminder to keep learning, even when the progress feels slow.",
    type: "text" as const,
    visibility: "public" as const,
  },
  {
    author: 4,
    content: "Weekend moments worth keeping.",
    type: "image" as const,
    visibility: "public" as const,
  },
  {
    author: 5,
    content: "Working on something creative. I'll share more when it's ready.",
    type: "text" as const,
    visibility: "followers" as const,
  },
  {
    author: 6,
    content: "A good conversation can make an ordinary day memorable.",
    type: "text" as const,
    visibility: "public" as const,
  },
  {
    author: 7,
    content: "Somewhere new, with a little more time to explore.",
    type: "mixed" as const,
    visibility: "public" as const,
  },
];

// ======================================================
// 4. MOCK COMMENTS
// ======================================================

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

// ======================================================
// 5. MOCK CONVERSATION MESSAGES
// ======================================================

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
// 6. HELPER FUNCTIONS
// ======================================================

function getAvatarUrl(seed: string) {
  return `https://api.dicebear.com/9.x/avataaars/svg?seed=${seed}`;
}

// Providing verified public image URLs for media seeds
function getRandomMediaUrl(index: number) {
  const sampleImages = [
    "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1000&q=80",
    "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1000&q=80",
    "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1000&q=80",
    "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1000&q=80",
  ];
  return sampleImages[index % sampleImages.length];
}

function getUser(index: number) {
  return MOCK_USERS[index % MOCK_USERS.length];
}

function getRandomUserExcluding(index: number, offset = 1) {
  return getUser(index + offset);
}

function assertSeedConfiguration() {
  if (!SEED_CONFIG.developmentOnly) {
    throw new Error("Seeding is disabled because developmentOnly is false.");
  }

  if (MOCK_USERS.length < 2) {
    throw new Error("At least two mock users are required.");
  }

  if (SEED_CONFIG.users > MOCK_USERS.length) {
    throw new Error("SEED_CONFIG.users exceeds the number of MOCK_USERS.");
  }

  if (SEED_CONFIG.posts > MOCK_POSTS.length) {
    throw new Error("SEED_CONFIG.posts exceeds the number of MOCK_POSTS.");
  }

  if (SEED_CONFIG.comments > MOCK_COMMENTS.length) {
    throw new Error(
      "SEED_CONFIG.comments exceeds the number of MOCK_COMMENTS.",
    );
  }
}

// ======================================================
// 7. MAIN SEED FUNCTION
// ======================================================

async function seed() {
  assertSeedConfiguration();

  console.log("🌱 Starting Atoll database seed...");
  console.log("⚠️ Make sure you are using a development database.");

  // Only seed the configured users.
  const users = MOCK_USERS.slice(0, SEED_CONFIG.users);

  // ----------------------------------------------------
  // A. AUTH USERS, PROFILES & SETTINGS
  // ----------------------------------------------------

  console.log("Creating users and profiles...");

  for (const user of users) {
    await db.insert(authUsers).values({
      id: user.id,
    });

    await db.insert(profiles).values({
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      dateOfBirth: user.dateOfBirth,
      bio: user.bio,
      avatarUrl: getAvatarUrl(user.avatarSeed),
      coverUrl: null,
      country: user.country,
      city: user.city,
      accountStatus: "active",
    });

    await db.insert(profileSettings).values({
      userId: user.id,
      isDiscoverable: true,
      showOnlineStatus: true,
      allowMessages: "everyone",
      notificationPreferences: {},
    });
  }

  console.log(`✅ Created ${users.length} users.`);

  // ----------------------------------------------------
  // B. POSTS & MEDIA
  // ----------------------------------------------------

  console.log("Creating posts...");

  const selectedPosts = MOCK_POSTS.slice(0, SEED_CONFIG.posts);
  const postIds: string[] = [];

  for (let i = 0; i < selectedPosts.length; i++) {
    const post = selectedPosts[i];
    const author = getUser(post.author);

    const [createdPost] = await db
      .insert(posts)
      .values({
        authorId: author.id,
        content: post.content,
        postType: post.type,
        visibility: post.visibility,
        status: "active",
      })
      .returning({ id: posts.id });

    postIds.push(createdPost.id);

    if (post.type === "image" || post.type === "mixed") {
      await db.insert(postMedia).values({
        postId: createdPost.id,
        storagePath: getRandomMediaUrl(i),
        mediaType: "image/jpeg",
        displayOrder: 0,
      });
    }
  }

  console.log(`✅ Created ${selectedPosts.length} posts.`);

  // ----------------------------------------------------
  // C. COMMENTS
  // ----------------------------------------------------

  console.log("Creating comments...");

  const commentIds: string[] = [];

  for (let i = 0; i < SEED_CONFIG.comments; i++) {
    const author = getUser(i + 1);
    const targetPostId = postIds[i % postIds.length];

    const [createdComment] = await db
      .insert(comments)
      .values({
        postId: targetPostId,
        authorId: author.id,
        content: MOCK_COMMENTS[i],
        status: "active",
      })
      .returning({ id: comments.id });

    commentIds.push(createdComment.id);
  }

  console.log(`✅ Created ${SEED_CONFIG.comments} comments.`);

  // ----------------------------------------------------
  // D. REACTIONS
  // ----------------------------------------------------

  console.log("Creating reactions...");

  const reactionTypes = ["like", "love", "support", "laugh"];

  for (let i = 0; i < postIds.length; i++) {
    // Multiple users can react to the same post.
    // A user can react only once to a given post.
    for (let j = 1; j <= 3; j++) {
      const user = getUser(i + j);

      await db
        .insert(reactions)
        .values({
          postId: postIds[i],
          userId: user.id,
          reactionType: reactionTypes[(i + j) % reactionTypes.length],
        })
        .onConflictDoNothing();
    }
  }

  console.log("✅ Created reactions.");

  // ----------------------------------------------------
  // E. FOLLOWS
  // ----------------------------------------------------

  console.log("Creating follow relationships...");

  for (let i = 0; i < users.length; i++) {
    // Each user follows two other users.
    for (let offset = 1; offset <= 2; offset++) {
      const follower = users[i];
      const following = getRandomUserExcluding(i, offset);

      if (follower.id === following.id) continue;

      await db
        .insert(follows)
        .values({
          followerId: follower.id,
          followingId: following.id,
        })
        .onConflictDoNothing();
    }
  }

  console.log("✅ Created follow relationships.");

  // ----------------------------------------------------
  // F. CONVERSATIONS, MEMBERS & MESSAGES
  // ----------------------------------------------------

  console.log("Creating conversations...");

  const conversationIds: string[] = [];
  const messageIds: string[] = [];
  let totalMessagesCreated = 0;

  for (let i = 0; i < SEED_CONFIG.conversations; i++) {
    const creator = users[i % users.length];
    const companion = users[(i + 1) % users.length];

    const [createdConversation] = await db
      .insert(conversations)
      .values({
        conversationType: "direct",
        createdBy: creator.id,
      })
      .returning({ id: conversations.id });

    conversationIds.push(createdConversation.id);

    await db.insert(conversationMembers).values([
      {
        conversationId: createdConversation.id,
        userId: creator.id,
        isActive: true,
      },
      {
        conversationId: createdConversation.id,
        userId: companion.id,
        isActive: true,
      },
    ]);

    // Create a short message history.
    for (let j = 0; j < SEED_CONFIG.messagesPerConversation; j++) {
      const sender = j % 2 === 0 ? creator : companion;

      const [createdMessage] = await db
        .insert(messages)
        .values({
          conversationId: createdConversation.id,
          senderId: sender.id,
          content: MOCK_MESSAGES[(i + j) % MOCK_MESSAGES.length],
          messageType: "text",
        })
        .returning({ id: messages.id });

      messageIds.push(createdMessage.id);
      totalMessagesCreated++;
    }
  }

  console.log(`✅ Created ${SEED_CONFIG.conversations} conversations.`);
  console.log(`✅ Created ${totalMessagesCreated} messages.`);

  // ----------------------------------------------------
  // G. BLOCKS
  // ----------------------------------------------------

  console.log("Creating block relationships...");

  await db
    .insert(blocks)
    .values({
      blockerId: users[0].id,
      blockedId: users[users.length - 1].id,
    })
    .onConflictDoNothing();

  console.log("✅ Created block relationship.");

  // ----------------------------------------------------
  // H. REPORTS
  // IMPORTANT: Each report has exactly one target.
  // ----------------------------------------------------

  console.log("Creating reports...");

  const [postReport] = await db
    .insert(reports)
    .values({
      reporterId: users[0].id,
      reportedUserId: getUser(1).id,
      postId: postIds[0],
      reason: "spam",
      description: "This post contains repeated unrelated promotional links.",
      status: "pending",
    })
    .returning({ id: reports.id });

  const [commentReport] = await db
    .insert(reports)
    .values({
      reporterId: users[2].id,
      reportedUserId: getUser(1).id,
      commentId: commentIds[0],
      reason: "harassment",
      description: "This comment contains inappropriate language.",
      status: "reviewing",
    })
    .returning({ id: reports.id });

  const [messageReport] = await db
    .insert(reports)
    .values({
      reporterId: users[3].id,
      reportedUserId: getUser(2).id,
      messageId: messageIds[0],
      reason: "spam",
      description:
        "This message contains repeated unwanted promotional content.",
      status: "pending",
    })
    .returning({ id: reports.id });

  console.log("✅ Created reports for posts, comments and messages.");

  // ----------------------------------------------------
  // I. MODERATION ACTIONS
  // ----------------------------------------------------

  console.log("Creating moderation history...");

  await db.insert(moderationActions).values([
    {
      adminId: users[3].id,
      targetUserId: users[1].id,
      reportId: postReport.id,
      actionType: "warning",
      reason: "A warning was issued after reviewing a reported post.",
      expiresAt: null,
    },
    {
      adminId: users[3].id,
      targetUserId: users[1].id,
      reportId: commentReport.id,
      actionType: "hide",
      reason: "The reported comment was hidden pending further review.",
      expiresAt: null,
    },
    {
      adminId: users[3].id,
      targetUserId: users[2].id,
      reportId: messageReport.id,
      actionType: "warning",
      reason: "A warning was issued after reviewing a reported message.",
      expiresAt: null,
    },
  ]);

  console.log("✅ Created moderation actions.");

  // ----------------------------------------------------
  // J. NOTIFICATIONS
  // ----------------------------------------------------

  console.log("Creating notifications...");

  await db.insert(notifications).values([
    {
      recipientId: users[1].id,
      actorId: users[0].id,
      notificationType: "post_like",
      referenceId: postIds[0],
      referenceType: "posts",
      isRead: false,
    },
    {
      recipientId: users[0].id,
      actorId: users[1].id,
      notificationType: "comment",
      referenceId: postIds[0],
      referenceType: "posts",
      isRead: false,
    },
    {
      recipientId: users[2].id,
      actorId: users[3].id,
      notificationType: "follow",
      referenceId: users[3].id,
      referenceType: "profiles",
      isRead: true,
    },
    {
      recipientId: users[4].id,
      actorId: users[5].id,
      notificationType: "message",
      referenceId: conversationIds[0],
      referenceType: "conversations",
      isRead: false,
    },
  ]);

  console.log("✅ Created notifications.");

  // ----------------------------------------------------
  // SUMMARY
  // ----------------------------------------------------

  console.log("\n========================================");
  console.log("        ATOLL SEED COMPLETED");
  console.log("========================================");
  console.log(`Users:          ${users.length}`);
  console.log(`Posts:          ${selectedPosts.length}`);
  console.log(`Comments:       ${SEED_CONFIG.comments}`);
  console.log(`Conversations:  ${SEED_CONFIG.conversations}`);
  console.log(`Messages:       ${totalMessagesCreated}`);
  console.log("Reports:        3");
  console.log("Moderation:     3");
  console.log("Notifications:  4");
  console.log("========================================\n");
}

// ======================================================
// 8. EXECUTION
// ======================================================

seed()
  .catch((error) => {
    console.error("❌ Atoll seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$client.end();
  });
