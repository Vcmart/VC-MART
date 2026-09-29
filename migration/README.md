# VC MART Firebase setup and migration

The app is configured for one backend: Firebase Authentication, Cloud Firestore, Firebase Storage and Cloud Functions. There is no Supabase client or SQL migration in the runtime.

The customer storefront has two modes only: Retail and Wholesale. Product administration, public listings, inventory, delivery settings, and orders use the same Firebase project.

## Collections

- `products/{productId}`: canonical product catalog and stock; public users can read active products, admins can manage all statuses.
- `users/{uid}`: profile keyed by Firebase Authentication UID.
- `orders/{orderId}`: server-created checkout snapshots and verified payment/order status.
- `coupons/{couponId}` and `couponUsages/{usageId}`: coupon rules and separate use records.
- `shops/{shopId}`: the three divisions.
- `settings/store`: inventory alert and store settings.
- `settings/homepage`: admin-managed offer slides.
- `branding/site`: active Storage logo URL.
- `adminUsers/{uid}`: server-provisioned admin allow-list; clients cannot write it.

## Storage paths

- `products/{productId}/{generated-file-name}` for product images (maximum 10 MB, image content types only).
- `branding/{generated-file-name}` for the active logo (maximum 5 MB).

Firestore documents store download URLs, never the image bytes.

## Required Firebase setup

1. Create a Firebase project and enable Email/Password Authentication, Firestore, Storage and Cloud Functions.
2. Copy `.env.example` to `.env.local` and fill the six `VITE_FIREBASE_*` public config values. These are Firebase web app identifiers, not privileged credentials.
3. Install the Firebase CLI (`npm install -g firebase-tools`), run `firebase login` and `firebase use --add`, then deploy with `firebase deploy --only firestore:rules,firestore:indexes,storage,functions,hosting`.
4. Configure Razorpay Functions secrets and the signed `payment.captured` HTTPS webhook as described in [`docs/razorpay-live.md`](../docs/razorpay-live.md). Keep all secret values out of source and frontend environment files.
5. Create the owner Firebase Authentication account in the console. Find its UID, then run `GCLOUD_PROJECT=<project> node functions/scripts/grantAdmin.mjs <uid>` using Application Default Credentials for a trusted operator account.
6. Import existing supplied JSON once: from `functions`, run `node scripts/importLegacyJson.mjs ../migration/legacy-data` to review a dry-run summary, then add `--apply` to write. The importer skips test/demonstration coupon-use records. Review each migrated document before exposing the site.

The migration folder keeps the supplied JSON and legacy source as import references. It does not seed the live site during normal startup. Existing URLs in the old product JSON are retained as URLs; new admin uploads use Firebase Storage.

## Commands

```powershell
pnpm install --ignore-scripts
Copy-Item .env.example .env.local
# Fill .env.local with the Firebase web app values from Project Settings
pnpm dev
pnpm typecheck
pnpm build
Push-Location functions
pnpm install --ignore-scripts --ignore-workspace
pnpm build
Pop-Location
```

No Firebase project credentials or Razorpay secret values are included with the supplied files. Verify a real authorized payment before accepting live orders.
