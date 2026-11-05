# Atoll Backend Architecture

**Project:** Atoll
**Status:** Architecture documentation
**Scope:** Backend architecture and technical responsibilities

## 1. Overview

Atoll uses a single Next.js application for its frontend and backend.

The backend is organized into service modules responsible for business logic, database operations, validation, and authorization-related checks.

There is no separate Express.js server.

The backend uses:

- Next.js Route Handlers for API endpoints.
- Supabase Auth for user authentication.
- Drizzle ORM for application database operations.
- PostgreSQL as the primary database.
- Zod for input validation.
- Supabase Storage for media files.
- Supabase Realtime for live application updates.

## 2. Technology Responsibilities

| Technology | Responsibility |
|---|---|
| Next.js | Application framework and backend API |
| TypeScript | Type safety |
| Supabase Auth | User authentication and session management |
| PostgreSQL | Persistent application data |
| Drizzle ORM | Database queries and transactions |
| Zod | Input validation |
| Supabase Storage | User-uploaded media |
| Supabase Realtime | Real-time updates |
| Vercel | Application hosting |

## 3. High-Level Architecture

The backend follows this request flow:

Frontend → API Route Handler → Authentication and Validation → Service Layer → Drizzle ORM → PostgreSQL

Each layer has a specific responsibility.

### 3.1 Frontend

The frontend is responsible for:

- Displaying application interfaces.
- Collecting user input.
- Sending requests to backend API endpoints.
- Displaying responses and errors.
- Managing client-side interactions.
- Subscribing to authorized real-time updates.

The frontend must not directly access privileged database credentials or perform privileged application database operations.

Supabase browser functionality is limited to operations designed for the client, such as authentication, storage operations permitted by policy, and authorized Realtime subscriptions.

### 3.2 API Route Handlers

Next.js Route Handlers act as the backend controllers.

Their responsibilities are:

- Receiving HTTP requests.
- Extracting and validating request data.
- Identifying the authenticated user.
- Calling the appropriate service function.
- Returning consistent HTTP responses.
- Converting application errors into API error responses.

Route Handlers should not contain substantial business logic or duplicate database queries implemented in services.

### 3.3 Authentication

Supabase Auth manages user identity and sessions.

The backend retrieves the authenticated user through the server-side Supabase client.

The authenticated user's ID is the identity used throughout the application.

The backend must not trust a user ID supplied by the frontend as proof of identity.

For operations performed on behalf of the current user, the actor ID must come from the verified server-side session.

### 3.4 Validation

Zod is used to validate incoming data.

Validation should happen at the API boundary before calling services.

Services should also validate their inputs where appropriate so that their business rules remain protected even when called from another trusted server-side module.

Validation responsibilities include:

- Required fields.
- Data types.
- UUID formats.
- String length limits.
- Allowed enum values.
- Pagination limits.
- Cross-field business constraints.

### 3.5 Service Layer

The service layer contains Atoll's business logic.

Services are responsible for:

- Enforcing business rules.
- Performing database operations.
- Checking ownership and access conditions.
- Coordinating related database changes.
- Using transactions where multiple operations must succeed together.
- Returning application data or throwing structured application errors.

Services should not depend on Next.js request or response objects.

This keeps business logic reusable and independent of the HTTP layer.

### 3.6 Database Layer

Drizzle ORM is used for application database operations.

The database schema is maintained in the project's Drizzle schema files.

PostgreSQL stores application data, including:

- Profiles.
- Profile settings.
- Posts and media references.
- Comments and reactions.
- Follows and blocks.
- Conversations and messages.
- Notifications.
- Reports.
- Administrative roles.
- Moderation actions.

Database transactions should be used when multiple related operations must succeed or fail together.

## 4. Database Access and Security

The application uses a privileged PostgreSQL connection for server-side Drizzle operations.

This has an important security consequence:

**PostgreSQL Row Level Security policies do not automatically protect queries made through a privileged database connection.**

Therefore, application services must explicitly enforce:

- User ownership.
- Conversation membership.
- Content visibility.
- Administrative permissions.
- Account status.
- Block relationships.
- Other relevant access rules.

Privileged database credentials must never be exposed to the browser or included in client-side code.

Supabase Auth and Supabase Storage have their own access-control considerations. Their policies must be configured separately.

## 5. Error Handling

The backend uses a shared `AppError` class to represent expected application errors.

Expected errors should carry:

- A human-readable message.
- A stable error code.
- An appropriate HTTP status code.

The API error handler converts these errors into a consistent response.

Unexpected internal errors should be logged on the server and returned to the client as generic server errors.

Internal database details, privileged credentials, and sensitive implementation information must not be exposed in API responses.

## 6. File Organization

The backend source code follows this general organization:

```text
src/
├── app/
│   └── api/
│       └── ...
├── db/
│   ├── schema/
│   └── ...
├── lib/
│   └── supabase/
│       ├── client.ts
│       ├── server.ts
│       └── env.ts
└── server/
    ├── auth/
    ├── errors/
    └── services/
```

Responsibilities:

| Directory | Responsibility |
|---|---|
| `src/app/api/` | HTTP API endpoints and controllers |
| `src/db/` | Database connection and database utilities |
| `src/db/schema/` | Drizzle table definitions |
| `src/lib/supabase/` | Supabase client configuration |
| `src/server/auth/` | Server-side authentication helpers |
| `src/server/errors/` | Shared application error handling |
| `src/server/services/` | Business logic and database operations |

The exact API route structure will be documented when the controller layer is designed.

## 7. Real-Time Architecture

Supabase Realtime is used for live updates.

The intended messaging flow is:

1. The client sends a message through the backend API.
2. The API authenticates the sender.
3. The message service verifies conversation membership.
4. The service stores the message in PostgreSQL.
5. Supabase Realtime publishes the authorized database change.
6. Other authorized conversation members receive the update.
7. The frontend updates the conversation interface.

The database remains the persistent source of truth. Realtime events notify clients about changes; they do not replace message storage or historical message retrieval.

Detailed subscription and authorization requirements are documented separately in `realtime.md`.

## 8. Design Principles

The backend follows these principles:

1. Keep the application in one Next.js repository.
2. Keep HTTP handling separate from business logic.
3. Keep services independent of Next.js request and response objects.
4. Use Supabase Auth for identity.
5. Use Drizzle ORM for application database operations.
6. Validate inputs using Zod.
7. Enforce authorization explicitly in privileged service operations.
8. Use transactions for related database changes.
9. Keep privileged credentials server-side.
10. Use Supabase Realtime for live updates without introducing a separate WebSocket server.

## 9. Implementation Status

This document describes the intended backend architecture based on the current project structure and technology decisions.

The service layer has been reviewed, but several services still require corrections.

The API controller layer has not yet been implemented and audited.

The following areas require further implementation or verification:

- Consistent authorization rules across services.
- Shared access-control helpers.
- Realtime subscription authorization and configuration.
- Temporary suspension expiry handling.
- Consistent API response formats.
- Service-level tests.
- API integration tests.

These items should be addressed in their respective documentation and implementation stages.

---

**Document:** `architecture.md`
**Project:** Atoll
