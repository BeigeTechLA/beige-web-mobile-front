---
name: Domain Migration Plan
overview: Migrate app from book.beige.app to beige.app while supporting both domains during transition. Update frontend URLs, metadata, and backend CORS configuration.
todos:
  - id: update-backend-env
    content: "Update backend .env: set FRONTEND_URL=https://beige.app and add beige.app to CORS_ORIGINS"
    status: completed
  - id: update-backend-docs
    content: Update env.example documentation comment to reference beige.app
    status: completed
  - id: update-navbar
    content: Update Navbar.tsx href from book.beige.app to beige.app
    status: completed
  - id: update-footer
    content: Update Footer.tsx href from book.beige.app to beige.app
    status: completed
  - id: update-topbar
    content: Update admin Topbar.tsx href from book.beige.app to beige.app
    status: completed
  - id: update-metadata
    content: Update app/layout.tsx metadata (metadataBase and url) to use beige.app
    status: completed
  - id: update-frontend-docs
    content: Update PASSWORD_RESET_PAGES.md example to use beige.app
    status: completed
isProject: false
---

# Domain Migration: book.beige.app → [beige.app](http://beige.app)

## Overview

Migrate the application from `book.beige.app` to `beige.app` while maintaining support for both domains during the transition period. The API subdomain `revure-api.beige.app` will remain unchanged.

## Changes Required

### 1. Backend Configuration (revure-v2-backend)

#### Update Environment Variables

**File: `[/Users/amrik/Documents/revure/revure-v2-backend/.env](/Users/amrik/Documents/revure/revure-v2-backend/.env)**`

Current configuration:

- Line 38: `FRONTEND_URL=http://localhost:3000`
- Line 47: `CORS_ORIGINS=http://localhost:3000,http://localhost:3001,https://book.beige.app`
- Line 50: `FRONTEND_URL=https://book.beige.app/` (duplicate)

Changes needed:

- Update `FRONTEND_URL` to `https://beige.app` (primary domain for email links, payment URLs, etc.)
- Add `https://beige.app` to `CORS_ORIGINS` to support both domains: `http://localhost:3000,http://localhost:3001,https://book.beige.app,https://beige.app`
- Remove the duplicate `FRONTEND_URL` on line 50

**Why this matters:** The backend uses `FRONTEND_URL` in:

- `[src/services/payment-links.service.js:19](/Users/amrik/Documents/revure/revure-v2-backend/src/services/payment-links.service.js)` - Payment link generation (fallback to `https://beige.app` if not set)
- `[src/utils/emailService.js](/Users/amrik/Documents/revure/revure-v2-backend/src/utils/emailService.js)` - Password reset links, welcome emails
- `[src/services/notification.service.js](/Users/amrik/Documents/revure/revure-v2-backend/src/services/notification.service.js)` - Project notification links

#### Update Documentation

**File: `[/Users/amrik/Documents/revure/revure-v2-backend/env.example](/Users/amrik/Documents/revure/revure-v2-backend/env.example)**`

- Line 32: Update comment from `# For production, set to: https://book.beige.app` to `# For production, set to: https://beige.app`

### 2. Frontend Configuration (revure-v2-landing)

#### Update Hardcoded URL References

**File: `[/Users/amrik/Documents/revure/revure-v2-landing/src/components/landing/Navbar.tsx](/Users/amrik/Documents/revure/revure-v2-landing/src/components/landing/Navbar.tsx)**`

- Line 245: Change `href="https://book.beige.app"` to `href="https://beige.app"`

**File: `[/Users/amrik/Documents/revure/revure-v2-landing/src/components/landing/Footer.tsx](/Users/amrik/Documents/revure/revure-v2-landing/src/components/landing/Footer.tsx)**`

- Line 48: Change `href="https://book.beige.app"` to `href="https://beige.app"`

**File: `[/Users/amrik/Documents/revure/revure-v2-landing/components/admin/Topbar.tsx](/Users/amrik/Documents/revure/revure-v2-landing/components/admin/Topbar.tsx)**`

- Line 17: Change `href="https://book.beige.app"` to `href="https://beige.app"`

#### Update Metadata (SEO & Social Sharing)

**File: `[/Users/amrik/Documents/revure/revure-v2-landing/app/layout.tsx](/Users/amrik/Documents/revure/revure-v2-landing/app/layout.tsx)**`

Current:

```typescript
metadataBase: new URL("https://book.beige.app"),
// ...
url: "https://book.beige.app/",
```

Update to:

```typescript
metadataBase: new URL("https://beige.app"),
// ...
url: "https://beige.app/",
```

This ensures proper canonical URLs and Open Graph metadata for search engines and social media sharing.

#### Update Documentation References

**File: `[/Users/amrik/Documents/revure/revure-v2-landing/claudedocs/PASSWORD_RESET_PAGES.md](/Users/amrik/Documents/revure/revure-v2-landing/claudedocs/PASSWORD_RESET_PAGES.md)**`

- Line 166: Update example link from `https://book.beige.app/reset-password?token=XXXXX` to `https://beige.app/reset-password?token=XXXXX`

### 3. No Changes Needed

The following will continue to work without modification:

- API endpoint remains at `https://revure-api.beige.app/v1/`
- All API calls in the frontend use the env variable `NEXT_PUBLIC_API_ENDPOINT`
- Both domains will be supported during transition via CORS configuration

## Migration Impact

### Email Links

All new emails (password resets, notifications, payment links) will use `beige.app`. Old emails with `book.beige.app` links will continue to work during the transition.

### Social Sharing & SEO

Once metadata is updated, new social shares will use `beige.app`. Search engines will recognize it as the canonical URL.

### Existing Users

Users with bookmarks to `book.beige.app` can continue using them since CORS supports both domains.

## Post-Migration Cleanup (Future)

Once `book.beige.app` is fully deprecated:

1. Remove `https://book.beige.app` from `CORS_ORIGINS`
2. Set up 301 redirects from `book.beige.app` to `beige.app` at the DNS/hosting level
3. Update any external links or integrations pointing to the old domain

## Testing Checklist

After deploying these changes:

- Test login/authentication from `beige.app`
- Test password reset emails contain `beige.app` links
- Test payment link generation uses `beige.app`
- Verify CORS allows requests from both domains
- Check social media preview uses new domain metadata
- Verify logo clicks redirect to `beige.app`
