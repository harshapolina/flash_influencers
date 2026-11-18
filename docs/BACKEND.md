# Orbitly Backend

## Stack
- Express + TypeScript
- JSON file DB (`server/data/orbitly.json`) — portable, no native SQLite binaries
- JWT auth (`jose`) + bcrypt password hashing
- SHA-256 hashed OTPs with TTL + attempt limits

## Run
```bash
# terminal 1
npm --prefix server run seed
npm --prefix server run dev

# terminal 2
npm run dev
```

API: `http://localhost:3001`  
App: `http://localhost:5173` (proxies `/api` → API)

## Key endpoints
| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/otp/send` | Send OTP (returns `devCode` in dev) |
| POST | `/api/auth/otp/verify` | Verify OTP |
| POST | `/api/auth/demo-login` | Instant Brand/Creator demo session |
| GET | `/api/auth/me` | Current user |
| PATCH | `/api/onboarding/progress` | Save onboarding answers |
| POST | `/api/onboarding/complete` | Finish onboarding |
| GET | `/api/creators` | Filtered creator marketplace |
| POST | `/api/creators/:id/like` | Like/unlike |
| GET | `/api/campaigns` | Brand board / creator opportunities |
| POST | `/api/campaigns/:id/apply` | Creator apply |
| POST | `/api/bookings` | Brand booking request |
| GET | `/api/messages` | Inbox |
| GET/POST | `/api/earnings` / `withdraw` | Creator earnings |

## Functional coverage
- Onboarding register → OTP send/verify → role steps → complete
- Brand: explore filters, likes, booking, campaigns, inbox
- Creator: opportunities save/apply, work tabs, earnings withdraw
