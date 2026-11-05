# Atoll Backend Documentation

Welcome to the backend documentation for **Atoll**.

This documentation describes the backend architecture, security rules, real-time functionality, service responsibilities and implementation decisions.

It is intended to keep the backend understandable, maintainable and consistent as the application grows.

## 1. Backend Overview

Atoll uses a single Next.js application for both frontend and backend functionality.

The backend stack consists of:

- Next.js Route Handlers for API endpoints.
- Supabase Auth for authentication.
- PostgreSQL for persistent application data.
- Drizzle ORM for database operations.
- Zod for input validation.
- Supabase Storage for media.
- Supabase Realtime for live updates.

The backend follows this general request flow:

**Frontend → API Route Handler → Authentication and Validation → Service Layer → Drizzle ORM → PostgreSQL**

There is no separate Express.js server.

## 2. Documentation Structure

The backend documentation is organized into the following sections.

### Architecture and shared rules

| Document | Description |
|---|---|
| [Architecture](./architecture.md) | Overall backend structure, technology responsibilities and request flow |
| [Authorization Rules](./authorization-rules.md) | Authentication, account restrictions, ownership, privacy and administrative permissions |
| [Real-Time Architecture](./realtime.md) | Messaging, notifications, subscriptions and real-time security requirements |

### Service documentation

Individual service documentation will be added after the service correction and documentation process begins.

Each service document will include:

- Complete corrected service implementation.
- Purpose and responsibilities.
- Functions, inputs and outputs.
- Dependencies.
- Database tables and operations.
- Authentication and authorization.
- Validation.
- Error handling.
- Known limitations and deferred decisions.
- Testing requirements.
- Implementation status.

The service catalog will provide a concise summary of all services.

## 3. Backend Source Structure

The backend source code is organized around these directories:

```text
src/
├── app/
│   └── api/
├── db/
│   └── schema/
├── lib/
│   └── supabase/
└── server/
    ├── auth/
    ├── errors/
    └── services/
```

| Directory | Responsibility |
|---|---|
| `app/api/` | API endpoints and controllers |
| `db/` | Database connection and utilities |
| `db/schema/` | Drizzle database schemas |
| `lib/supabase/` | Supabase client configuration |
| `server/auth/` | Authentication helpers |
| `server/errors/` | Shared application errors |
| `server/services/` | Business logic and database operations |

## 4. Documentation and Implementation Workflow

Backend work follows this process:

1. Document the overall architecture and shared rules.
2. Audit the existing service implementation.
3. Identify defects, missing rules and design decisions.
4. Correct the service implementation.
5. Provide the complete replacement service file.
6. Test the service where practical.
7. Document the corrected service.
8. Update the service catalog.
9. Proceed to the next service.

API controllers will be designed after the service layer has been reviewed and corrected.

## 5. Important Security Principle

The backend uses a privileged PostgreSQL connection for Drizzle operations.

Consequently, service-level authorization is mandatory.

Do not assume that PostgreSQL Row Level Security automatically protects queries made through privileged server-side database connections.

All protected operations must explicitly verify the authenticated actor and their permission to access or modify the relevant resource.

## 6. Current Documentation Status

| Area | Status |
|---|---|
| Architecture documentation | Completed |
| Authorization rules | Completed |
| Real-time architecture | Completed |
| Service audit | Completed |
| Corrected service implementations | Pending |
| Individual service documentation | Pending |
| Service catalog | Pending |
| API controller documentation | Pending |
| API implementation | Not started |
| Integration testing | Pending |

## 7. Documentation Maintenance

Whenever backend behavior or architecture changes:

- Update the relevant documentation.
- Keep implementation status accurate.
- Record important decisions.
- Distinguish implemented behavior from planned behavior.
- Avoid documenting proposed functionality as if it already exists.

This documentation should remain aligned with the actual repository implementation.

---

**Project:** Atoll
**Section:** Backend Documentation
