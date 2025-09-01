# WhatsX_Advanced Prototype

Monorepo with `frontend` (React + Tailwind + Firebase client) and `server` (Express + Firebase Admin + Twilio).

## Prereqs
- Node 18+
- Firebase project (enable Email/Password)
- Service account JSON for Admin SDK (set `GOOGLE_APPLICATION_CREDENTIALS`)
- Optional Twilio Sandbox for WhatsApp

## Setup

### Server
1. Copy env:
```bash
cp server/.env.example server/.env
```
2. Ensure `GOOGLE_APPLICATION_CREDENTIALS` points to your service account JSON and `FIREBASE_PROJECT_ID` is set.
3. Install and run:
```bash
cd server
npm i
npm run dev
```

### Frontend
1. Copy env:
```bash
cp frontend/.env.example frontend/.env
```
2. Fill Firebase web config and `VITE_API_BASE_URL`.
3. Install and run:
```bash
cd frontend
npm i
npm run dev
```

## Notes
- Admin users are recognized via custom claim `admin: true` on their Firebase ID token.
- Templates are scoped to the authenticated user's `uid`.
- `/api/send-message` performs duplicate removal and simulates sending unless `ALLOW_SEND=true`.
