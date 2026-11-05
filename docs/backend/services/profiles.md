# Profiles Service

**Source file:** `src/server/services/profiles.service.ts`
**Domain:** User profiles and profile preferences
**Status:** Corrected; TypeScript check passed

## 1. Purpose

The Profiles Service manages user profile information and profile-specific settings.

It supports:
- Retrieving public profile information by user ID.
- Retrieving public profile information by username.
- Retrieving the complete profile record for its owner.
- Updating profile information.
- Retrieving and updating profile settings.

The service contains database operations and input validation. API controllers are responsible for authentication and ensuring that users can only modify their own information.

## 2. Main Functions

| Function | Responsibility |
|---|---|
| `getProfileById(userId)` | Retrieves selected public fields for an active profile. |
| `getOwnProfileById(userId)` | Retrieves the complete profile record for its owner. |
| `getProfileByUsername(username)` | Retrieves selected public fields using a username. |
| `updateProfile(userId, input)` | Updates the supplied profile fields. |
| `getProfileSettings(userId)` | Retrieves settings belonging to a user. |
| `updateProfileSettings(userId, input)` | Updates the supplied profile settings. |

## 3. Validation

The service uses Zod to validate input.

### Profile fields

- Username: 3–30 characters; letters, numbers, and underscores only.
- Display name: maximum 60 characters.
- Bio: maximum 500 characters.
- Avatar and cover references: non-empty strings, maximum 2,048 characters, or `null`.
- Country and city: maximum 100 characters.

Unknown fields are rejected. At least one field must be supplied for an update.

### Profile settings

- `isDiscoverable`: boolean.
- `showOnlineStatus`: boolean.
- `allowMessages`: `everyone`, `followers`, or `nobody`.
- `notificationPreferences`: JSON-like key/value object.

At least one setting must be supplied for an update.

## 4. Access and Authorization

The service validates user IDs as UUIDs.

The service does not independently establish that a supplied user ID belongs to the authenticated user. Trusted server-side code must supply the authenticated user's ID to owner-only operations.

Important distinctions:

- `getProfileById` returns selected public fields and excludes profiles whose account status is not active.
- `getProfileByUsername` also returns selected public fields and excludes inactive profiles.
- `getOwnProfileById` returns the complete profile record and must only be used for the authenticated owner.
- `updateProfile`, `getProfileSettings`, and `updateProfileSettings` require ownership enforcement by the API controller.

The database connection uses privileged access. Database-level RLS must not be assumed to protect these service operations.

## 5. Database Interaction

The service uses Drizzle ORM with the `profiles` and `profileSettings` tables.

Profile retrieval uses explicit field selection for public responses. Owner retrieval uses the complete profile record.

Updates use Drizzle `update`, `set`, and `returning` operations. Only supplied fields are changed.

## 6. Error Handling

The service uses `AppError` for expected failures.

| Error code | Situation |
|---|---|
| `INVALID_USER_ID` | User ID is not a valid UUID. |
| `INVALID_USERNAME` | Username does not meet validation rules. |
| `INVALID_PROFILE_INPUT` | Profile update input is invalid. |
| `INVALID_PROFILE_SETTINGS` | Settings update input is invalid. |
| `PROFILE_NOT_FOUND` | Requested profile does not exist or is not active for public retrieval. |
| `PROFILE_SETTINGS_NOT_FOUND` | Settings record does not exist. |
| `USERNAME_ALREADY_TAKEN` | PostgreSQL reports a username uniqueness conflict. |

Unexpected database errors are rethrown for centralized error handling.

## 7. Important Implementation Notes

- The file imports `server-only` to prevent accidental client-side use.
- Public profile retrieval does not return the complete database row.
- Username lookup is not equivalent to discovery. Discovery must separately enforce `profileSettings.isDiscoverable`.
- Avatar and cover references currently accept strings. A consistent Supabase Storage path and ownership convention is still required.
- Notification preference keys and supported values have not yet been standardized.
- The service does not yet contain shared active-account or block-policy enforcement.
- Username conflict handling depends on PostgreSQL identifying the relevant username constraint.

## 8. Future Integration Requirements

Before API controllers are implemented:

1. Derive owner IDs from the authenticated Supabase session, never from an untrusted request body.
2. Enforce account-status rules for owner operations.
3. Enforce profile discoverability in discovery endpoints.
4. Standardize avatar and cover Storage references and verify upload ownership.
5. Define supported notification preference keys and values.
6. Confirm the actual username unique-constraint name and conflict handling.

## 9. Verification

The corrected service passed:

```powershell
npx tsc --noEmit
```

This confirms TypeScript compilation. It does not by itself verify authorization behavior, database queries, or runtime functionality.
