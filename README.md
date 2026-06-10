# Dekadans AI Frontend

This project is the account dashboard for the Better Auth based backend (`../dekadansai`).

Scope:

- login / registration
- API key creation
- account-based and key-based rate limit tracking

## Running

1. Start the backend (`../dekadansai`)
2. Create the frontend env file

```bash
cp .env.example .env
```

3. Start the frontend

```bash
npm install
npm run dev
```

The app opens at `http://localhost:3000` by default.

## Env

- `BACKEND_BASE_URL`: Backend base URL (default: `http://localhost:4000`)
- `NEXT_PUBLIC_APP_URL`: Frontend public URL (default: `http://localhost:3000`)

Note: The frontend proxies to the backend through Next.js route handlers (`/api/auth/*`, `/api/account/rate-limit`).
