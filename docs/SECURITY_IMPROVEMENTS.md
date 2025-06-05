# Security Improvements Documentation
_MonetizeG – June 2025_

---

## 1. Executive Summary
Following an in-depth audit (“Clerk Auth Issues Analysis”), several critical authentication and security risks were discovered in the MonetizeG code-base:

* Unprotected API routes exposed user data.  
* GitHub OAuth tokens were stored in client-readable cookies.  
* Incomplete `auth.protect()` pattern caused broken redirects.  
* Missing modern security headers (CSP, Permissions-Policy, COOP/COEP).  
* Error handling could leak stack-traces & secrets to logs.  

These weaknesses have been **fully remediated**. The changes harden the application, adopt a default-deny approach to routing, encrypt all third-party tokens at rest, and introduce structured error handling plus defence-in-depth headers.

---

## 2. Issue-by-Issue Breakdown

| ID | Original Problem | Fix Applied | Risk ↓ |
|----|------------------|-------------|--------|
| **A1** | Middleware protected only a subset of `/api/**` & dashboard routes. | Re-wrote `src/middleware.ts` to treat **all** `/api/**` as protected except an explicit allow-list (Stripe webhooks, public ads). Added `isDashboardRoute`. | High → Negligible |
| **A2** | Incorrect `auth.protect()` usage ‑ response could be lost. | Used Clerk-recommended pattern (`const res = await auth.protect(); if (res) return res;`). | Medium → None |
| **A6 / S1** | GitHub tokens stored in `github_access_token` cookie (`sameSite=lax`). | • Added `githubAccessToken` column to `User` model.  • Created `src/lib/crypto.ts` (AES-256-GCM).  • Tokens now encrypted in DB, **never** leave server. | High → Negligible |
| **S2** | Prisma threw generic errors; logs leaked details. | Introduced `DatabaseError`, `AuthorizationError`, `ValidationError` with safe redaction + structured logging in `src/lib/prisma.ts`. | Medium → Low |
| **S3 / S4** | No Content-Security-Policy; deprecated `X-XSS-Protection`. | Added comprehensive CSP, HSTS, Permissions-Policy, COOP/CORP headers in `next.config.js` & middleware. | Medium → Low |
| **D4** | Silent retry on permission errors in `user.service.ts`. | Removed retry, surfaced explicit `AuthorizationError`. | Medium → Low |
| **Misc.** | CSP, CORS, encryption key handling, .env template lacking. | Added `.env.example`; CORS pre-flight handled in middleware. | — |

---

## 3. Implementation Details

### 3.1 Middleware Overhaul
* **Default-deny**: `isApiRoute('/api/(.*)')` + `!isPublicRoute` secures every backend handler.
* Correct **protect** flow; any unauthenticated request is redirected or receives `401`.
* Centralized addition of security headers & CORS for API routes.
* Deprecated headers removed, modern ones added:
  * _Strict-Transport-Security_, _Permissions-Policy_, _Cross-Origin-Opener-Policy_, etc.
  * CSP whitelists Clerk, Stripe and Vercel assets only.

### 3.2 Secure GitHub Token Storage
* Prisma schema extended with `githubAccessToken VARCHAR`.
* `src/lib/crypto.ts` provides AES-256-GCM helpers (`encrypt`, `decrypt`, `isEncrypted`).
* `POST /api/github/token` validates token via Octokit, encrypts, stores in DB.
* `GET` now returns **status only** (`hasToken: boolean`); token never leaves server.
* Down-stream API routes obtain tokens via `UserService.getGitHubClient()`, which decrypts on-demand.

### 3.3 Error-Handling & Logging
* New error classes ensure caller can pattern-match.
* `logError()` redacts stacks & secrets in production, verbose in dev.
* Prisma client logs only `error|warn` in dev, `error` in prod.

### 3.4 Security Headers in `next.config.js`
Applied at **edge** (Next.js headers) and **runtime** (middleware) for redundancy. CSP blocks mixed-content, disables FLoC/Topics, and confines frames to Clerk/Stripe.

### 3.5 Environment & Encryption Key
* `.env.example` documents 32-byte `ENCRYPTION_KEY` and generation commands.
* If key missing in dev, fallback hash + console warning; production refuses to start without key (CI step recommended).

---

## 4. Migration Guide

1. **Database Migration**
   ```bash
   npx prisma migrate deploy
   # Adds github_access_token & github_username columns
   ```
2. **Environment**
   * Copy `.env.example` → `.env`.
   * Generate secure `ENCRYPTION_KEY` (`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`).
   * Add Clerk / Stripe keys if not present.
3. **Deploy**
   * Push code to Vercel or your CI; ensure `ENCRYPTION_KEY` & new vars added to secrets store.
   * Run Prisma migrations in prod (Vercel Postgres / Neon).
4. **User Action**
   * Existing users must re-connect GitHub: old cookies invalidated on first request.

---

## 5. Security Best Practices (Going Forward)

* **Principle of least privilege** – store third-party tokens encrypted; restrict scopes.
* **Default-deny routing** – continue to treat new `/api/**` routes as private unless explicitly public.
* **Rotate Secrets** – periodically rotate encryption key & OAuth tokens (require UI flow).
* **Dependency Hygiene** – enable Dependabot & `npm audit --production`.
* **Secure Headers** – review CSP on every new external script.
* **Webhooks** – always verify raw body (`stripe.webhooks.constructEvent`).

---

## 6. Testing and Verification

| Test | Tool | Expected Result |
|------|------|-----------------|
| Protected route `/api/users` without auth | Postman | `401 Unauthorized` |
| Public route `/api/stripe/webhook` | cURL | `200/204` (signature verified) |
| GitHub token leak attempt (`document.cookie`) | Browser dev-tools | No `github_access_token` cookie present |
| CSP Violation | Browser dev-tools console | Block inline `<script>alert(1)</script>` |
| Unit test `crypto.encrypt/decrypt` | Jest | Round-trip integrity |

Automated suites:
```bash
npm run test           # unit tests
npx playwright test    # e2e auth & API coverage
```

---

## 7. Monitoring & Maintenance

1. **Runtime Monitoring**
   * Enable Sentry for Next.js edge + serverless functions.
   * Track Clerk webhook failures; alert on 4xx/5xx spikes.

2. **Log Redaction**
   * Ensure prod logs use `logError()` only.
   * Periodic audit of Vercel / Cloud logs for PII.

3. **Key & Token Rotation**
   * Semi-annual encryption key rotation plan (re-encrypt in place).
   * Web UI reminder for users to re-connect GitHub if token older than 1-year.

4. **Security Review Cadence**
   * Quarterly dependency scan & penetration test.
   * Update this document after each significant change.

---

_End of Document_
