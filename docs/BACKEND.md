# Orbitly Backend

## Stack
- Express + TypeScript
- MongoDB (Atlas / local)
- JWT auth (`jose`) + bcrypt password hashing
- Real OTP email via Nodemailer (SMTP or Ethereal fallback)
- Real Google Sign-In via Google ID token verification (`google-auth-library`)

## Run
```bash
# terminal 1 — API
cp server/.env.example server/.env   # fill secrets
npm --prefix server run seed
npm --prefix server run dev

# terminal 2 — web app
cp .env.example .env                 # add VITE_GOOGLE_CLIENT_ID
npm run dev
```

API: `http://localhost:3001`  
App: `http://localhost:5173` (proxies `/api` → API)

## Required env (real product)
### `server/.env`
- `MONGODB_URI`
- `JWT_SECRET`
- `GOOGLE_CLIENT_ID` — Google Cloud **Web** OAuth client ID
- `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM`
  - Gmail: create an [App Password](https://myaccount.google.com/apppasswords) and use it as `SMTP_PASS`

### root `.env`
- `VITE_GOOGLE_CLIENT_ID` — same Web client ID as server

## Auth flows
1. **Email register** → JWT → **OTP email** → verify → role onboarding → complete
2. **Email login** → JWT → dashboard (if onboarding done)
3. **Google Sign-In** → GIS credential → `POST /api/auth/google` verifies ID token → create/link user → dashboard/onboarding
4. **Demo login** (`POST /api/auth/demo-login`) — seeded brand/creator accounts for QA only

## Key endpoints
| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Password login |
| POST | `/api/auth/google` | Google ID token login/signup |
| POST | `/api/auth/otp/send` | Email OTP (Nodemailer) |
| POST | `/api/auth/otp/verify` | Verify OTP |
| POST | `/api/auth/demo-login` | Instant Brand/Creator demo session |
| GET | `/api/auth/me` | Current user |
| PATCH | `/api/onboarding/progress` | Save onboarding answers |
| POST | `/api/onboarding/complete` | Finish onboarding |
| GET | `/api/creators` | Filtered creator marketplace |
| POST | `/api/creators/:id/like` | Like/unlike |
| GET | `/api/campaigns` | Brand board / creator opportunities |
| POST | `/api/campaigns/:id/apply` | Creator apply |
| GET | `/api/bookings` | Brand/creator booking list (role-aware) |
| POST | `/api/bookings` | Brand booking request (`instant` or `scheduled`) |
| PATCH | `/api/bookings/:id` | Creator accept/reject · Brand complete |
| GET | `/api/messages` | Inbox |
| POST | `/api/messages/:id/read` | Mark message read |
| GET/POST | `/api/earnings` / `withdraw` | Creator earnings |

## Functional coverage
- Onboarding register → OTP email → verify → role steps → complete
- Brand: explore filters, likes, booking, campaigns, inbox (mark read)
- Creator: opportunities save/apply, work tabs, earnings withdraw
- Google auth creates verified users with `authProvider: "google"`
