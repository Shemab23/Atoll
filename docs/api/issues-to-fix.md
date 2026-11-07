
# Atoll API — Issues to Fix

**Status:** Open
**Purpose:** Record known API implementation issues without changing current behavior.

This document is a developer issue register. It is separate from the OpenAPI specification.

---

## 1. Route validation issues

| Route | Issue | Required follow-up |
|---|---|---|
| `GET /api/admin/overview/users/[userId]` | `userId` is not validated as a UUID in the route. | Add UUID validation before calling the controller. |
| `GET /api/admin/overview/users/[userId]/moderation-history` | Pagination is manually parsed and invalid values throw generic errors. | Standardize query validation and error responses. |
| `GET /api/admin/reports` | `status` is cast to `ReportStatus` without validating the supplied value. | Validate against supported report statuses. |
| `GET /api/admin/reports/[reportId]` | `reportId` is not validated as a UUID in the route. | Add UUID validation. |
| `GET /api/admin/moderation/action` | Pagination is manually parsed and invalid values throw generic errors. | Standardize pagination validation. |
| `GET /api/admin/moderation/queue` | Pagination and status query parameters need consistent validation. | Validate limit, offset and status. |
| `GET /api/admin/moderation/action/limited` | Pagination is manually parsed and checked. | Use the shared pagination validation approach. |
| `GET /api/admin/overview/users` | Pagination is manually parsed and invalid values throw generic errors. | Standardize pagination validation. |

---

## 2. Pagination consistency

**Issue:** Pagination is handled differently across several endpoints.

Some routes manually convert query parameters using `Number()`, perform local checks and throw generic errors. Other routes may use different validation approaches.

**Required follow-up:**

- Establish one shared pagination validation approach.
- Define consistent defaults.
- Define minimum and maximum limits.
- Reject negative offsets.
- Reject non-integer values.
- Return consistent 400 responses for invalid input.
- Use consistent pagination metadata in list responses where supported.

### Suggested standard

| Parameter | Suggested rule |
|---|---|
| `limit` | Integer, default 20, minimum 1, maximum 100 |
| `offset` | Integer, default 0, minimum 0 |
| Invalid values | Standard 400 error response |
| Response metadata | Include `limit`, `offset`, and `hasMore` or `total` where supported |

These are proposed conventions, not a statement that every current endpoint follows them.

---

## 3. Missing or unverified endpoints

| Capability | Current observation | Follow-up |
|---|---|---|
| General posts feed | No `GET /api/posts` appeared in the supplied API route inventory. | Confirm whether the feed is implemented through another route or server-side operation. |
| Reporting a user | `POST /api/reports` currently accepts post, comment and message targets. | Decide whether user reporting is part of the current scope. |
| Reaction state | No explicit GET endpoint for retrieving reaction state appeared in the route inventory. | Confirm whether existing read operations already provide this information. |
| Authentication callback | No callback appeared under `src/app/api`. | Check whether `src/app/auth/callback/route.ts` exists outside the API folder. |
| Reactions folder | `src/app/api/reactions` appeared empty. | Confirm that nested post and comment reaction routes are sufficient. |

Do not add these endpoints automatically. Confirm their intended scope first.

---

## 4. Moderation route clarification

| Route | Current purpose | Follow-up |
|---|---|---|
| `POST /api/admin/moderation/action` | Applies a report moderation action through `applyReportModerationAction`. | Verify its authorization level in the service. |
| `POST /api/admin/moderation/action/limited` | Applies an action through `applyAction`. | Moderator-only, as specified for this route. |
| `POST /api/admin/moderation/action/batch` | Applies multiple report-based actions. | Verify its authorization level in the service. |

The individual action routes use different controller methods. Keep their documented purposes distinct.

---

## 5. Shared HTTP error handling

### `withApiHandler`

Current responsibility:

- Execute an asynchronous route handler.
- Catch thrown errors and rejected promises.
- Pass errors to `apiError`.
- Return the resulting HTTP response.

### `apiError`

Current behavior:

- `AppError` returns its configured status code, error code and message.
- Unexpected errors are logged on the server.
- Unexpected errors return a generic 500 response.
- Internal server and database details are not exposed in the response.

### Remaining checks

| Check | Follow-up |
|---|---|
| Zod validation errors | Confirm `parseJsonBody` converts them into standard 400 errors before they reach `apiError`. |
| Malformed JSON | Confirm invalid JSON is handled as a 400 instead of an unexpected 500. |
| Sensitive logging | Review whether thrown errors could contain passwords, tokens or other sensitive information. |
| Dynamic route handler compatibility | Verify the wrapper works with the Next.js route handler signatures used by dynamic routes. |
| Response headers | Confirm intentional headers and cookies are preserved by route handlers. |

No rewrite of `withApiHandler` or `apiError` is currently recommended.

---

## 6. Authentication and authorization consistency

**Issue:** Several controllers use `getCurrentUser()` to check whether a Supabase user is authenticated. Authentication alone does not establish that the Atoll profile is active or that the user is authorized to perform a particular action.

### Required checks

- Confirm protected services reject deleted profiles.
- Confirm suspended profiles are handled according to the authorization rules.
- Confirm resource ownership is enforced in services.
- Confirm conversation membership is enforced for messaging operations.
- Confirm administrator and moderator roles are checked against trusted database records.
- Confirm deleted accounts cannot continue using existing sessions.
- Confirm deleted or suspended accounts cannot retain administrative privileges.

Admin and moderation services must not rely on user-provided metadata as proof of administrator privileges.

---

## 7. Account deletion

**Current implementation:** Account retirement is integrated into `ProfileController` and the profile service layer.

### Checks to perform

- Verify the password before retirement.
- Verify profile and related application data are retired transactionally.
- Verify the original email address can be used for a new signup.
- Verify the Auth identity is disabled.
- Verify global sessions are invalidated.
- Verify retry behavior when database retirement succeeds but the Auth update fails.
- Verify the deleted profile cannot access protected endpoints.
- Verify media storage paths are preserved for future cleanup.
- Verify retained moderation and administrative records cannot grant deleted users access.

No new table or database schema change is requested for this work.

---

## 8. Documentation accuracy

- Keep `openapi.yaml` aligned with actual route methods and paths.
- Verify controller response payloads before documenting their exact fields.
- Verify endpoint authorization requirements against service implementations.
- Keep known issues in this file rather than presenting them as implemented behavior.
- Replace the production placeholder URL in `openapi.yaml` before deployment.
- Verify Swagger UI authentication behavior before relying on its "Try it out" feature.

---

## 9. General rule

This issue register records follow-up work. It does not authorize new product features or automatic changes to the existing implementation.
