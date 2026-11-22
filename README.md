# Aura Beauty – appointment booking

Nuxt 4 + Tailwind CSS v4 + @nuxtjs/i18n (EN/PL) + Firebase (Firestore).

This project uses **pnpm** only.

## Setup

```bash
pnpm install
cp .env.example .env   # fill in the Firebase web config
```

## Development

```bash
pnpm dev         # http://localhost:3000
pnpm typecheck
```

## Deploy (Firebase Hosting)

The site is generated as static files (`nuxt generate`) and served by Firebase Hosting:
https://apointment-crm.web.app

```bash
pnpm run deploy        # nuxt generate + firebase deploy --only hosting
pnpm run deploy:rules  # upload firestore.rules
```

The Firebase web config from `.env` is baked in at generate time. Requires being logged in:
`pnpm exec firebase login`.

## Firestore

Create a Firestore database in the Firebase console, then deploy the security rules:

```bash
pnpm dlx firebase-tools login
pnpm dlx firebase-tools deploy --only firestore:rules
```

Bookings are stored in `appointments` (create-only for clients) and `busySlots`
(anonymous time ranges, publicly readable for availability). See `firestore.rules`.

## Admin panel

Available at `/admin` (`/en/admin` in English). To give someone access:

1. Firebase console → **Authentication** → Sign-in method: enable **Email/Password**.
2. **Authentication → Users → Add user** (email + password). Copy the user's **UID**.
3. **Firestore → Start collection** `admins` → document ID = that UID (add any field, e.g. `email`).

Only users with an `admins/{uid}` document can read appointments and change their status;
this is enforced by `firestore.rules`, not just by the UI.
