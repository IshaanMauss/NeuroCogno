# MongoDB Atlas Production Setup

Date: 2026-08-30
Purpose: production database isolation and network hardening for NeuroCogno.

## Current Code Routing

The backend already points to MongoDB through environment variables:

- `MONGODB_URI`
- `MONGODB_DB_NAME`

The connection is made in `server/src/config/db.js`, so no application routing rewrite is needed. Production will point to Atlas by setting deployment secrets only.

## Production Target

Use one production database, not multiple databases:

- Database name: `neurocogno_prod`
- App DB user: `neurocogno_app_prod`
- Admin/dashboard app still reads/writes the same production database through backend APIs.
- The frontend must never connect to MongoDB directly.

## Atlas Production User

Create a dedicated database user for the deployed backend only.

Required rule:
- Do not use the development DB user.
- Do not use Atlas owner/admin credentials in the app.
- Use a generated strong password stored only in the deployment secret manager.
- Give the user `readWrite` only on `neurocogno_prod` unless a later feature truly needs more.

Atlas UI path:
1. Open MongoDB Atlas.
2. Select the NeuroCogno project.
3. Go to Database Access.
4. Add New Database User.
5. Authentication method: Password.
6. Username: `neurocogno_app_prod`.
7. Password: generate a strong password.
8. Database User Privileges: `readWrite` on `neurocogno_prod`.
9. Save.

Atlas CLI equivalent, after Atlas CLI login/profile setup:

```bash
atlas dbusers create readWrite \
  --username neurocogno_app_prod \
  --password "<GENERATED_STRONG_PASSWORD>" \
  --scope neurocogno_prod \
  --projectId "<ATLAS_PROJECT_ID>"
```

If the CLI command differs by installed Atlas CLI version, use the Atlas UI path above. The project requirement is the same: a least-privilege app user for the production DB.

## IP Access List

Production should not keep `0.0.0.0/0` open.

Use one of these production options:

1. Best: private endpoint / VPC peering when hosting supports it.
2. Good: static outbound IP from the backend host, then allowlist only that IP.
3. Temporary only: broad access during deployment testing, then remove it before handover.

Atlas UI path:
1. Open MongoDB Atlas.
2. Select the NeuroCogno project.
3. Go to Network Access.
4. Remove temporary broad entries such as `0.0.0.0/0` when production testing is done.
5. Add the backend deployment server outbound/static IP.
6. Add comment: `NeuroCogno production backend`.
7. Save and wait for Atlas to apply the change.

Atlas CLI equivalent:

```bash
atlas accessLists create "<PRODUCTION_BACKEND_STATIC_IP>" \
  --type ipAddress \
  --projectId "<ATLAS_PROJECT_ID>" \
  --comment "NeuroCogno production backend"
```

## Deployment Environment Values

Set these in the deployment platform secret manager, not in Git:

```bash
NODE_ENV=production
MONGODB_URI=mongodb+srv://neurocogno_app_prod:<PASSWORD>@<CLUSTER_HOST>/neurocogno_prod?retryWrites=true&w=majority
MONGODB_DB_NAME=neurocogno_prod
```

Also rotate/set:

```bash
JWT_ACCESS_SECRET=<64+ char random value>
JWT_REFRESH_SECRET=<64+ char different random value>
COOKIE_SECRET=<32+ char random value>
ADMIN_USERS_JSON=<real CEO/COO/developer accounts with strong passwords>
RAZORPAY_KEY_ID=<live key id>
RAZORPAY_KEY_SECRET=<live secret>
RAZORPAY_WEBHOOK_SECRET=<live webhook secret>
```

## Verification After Setup

Run after production deploy:

1. Backend starts without production secret guard errors.
2. Admin login works with production admin user.
3. Public appointment form saves data into `neurocogno_prod`.
4. CMS image upload saves and renders publicly.
5. Atlas Network Access no longer contains `0.0.0.0/0` unless it is a documented temporary deploy window.
6. Atlas Database Access shows app user only has required permissions.
7. Atlas backups are enabled.

## Known Deploy-Time Dependency

This cannot be completed from the local codebase alone. It requires either:

- Atlas UI access with Project Owner permissions, or
- Atlas API/CLI credentials with project read-write permission, plus the final backend static outbound IP.

References:
- MongoDB Atlas IP access list: https://www.mongodb.com/docs/atlas/security/add-ip-address-to-list/
- MongoDB Atlas security features: https://www.mongodb.com/docs/atlas/setup-cluster-security/
- Atlas CLI access list create: https://www.mongodb.com/docs/atlas/cli/current/command/atlas-accesslists-create/