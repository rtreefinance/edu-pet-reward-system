# Edu Pet Reward System

A gamified learning incentive platform for elementary school students. Earn coins through homework scores and daily check-ins, then spend them on a virtual pet companion.

## Roles

| Role | Capabilities |
|------|-------------|
| Student | Interactive — check in, submit homework, feed/upgrade pet, enter pet shop |
| Teacher | Management — grade assignments, view class stats |
| Parent | Read-only — monitor child's progress, coins, pet status |

## Coin Rules

| Action | Reward |
|--------|--------|
| Perfect homework (100 score) | +50 coins |
| Daily check-in | +10 coins |
| 7-day streak bonus | +50 coins |

## Pet Rules

- Hunger decays -20 every 24 hours (cron job)
- Feed pet to restore hunger (coin cost)
- Evolution triggers at Lv 3, 6, 10, 50
- Customize pet with items from the pet shop

## Tech Stack

- **Frontend**: React + TypeScript + Tailwind CSS (mobile-first)
- **Backend**: Node.js + Express + TypeScript + JWT auth
- **Database**: MongoDB + Mongoose
- **Deploy**: Docker + docker-compose

## Quick Start

```bash
# Copy env file
cp .env.example .env

# Start with Docker
docker-compose up -d

# Or start manually
cd server && npm install && npm run dev
cd client && npm install && npm run dev
```

## Project Structure

```
edu-pet-reward-system/
├── server/           # Express API server
│   ├── src/
│   │   ├── models/   # Mongoose schemas (User, Homework, CheckIn, Pet, Transaction)
│   │   ├── routes/   # API routes (auth, checkin, homework, pet, parent)
│   │   ├── middleware/ # JWT auth, role guard
│   │   ├── services/ # Transaction service, cron jobs, pet decay
│   │   └── app.ts    # Express entry point
│   └── package.json
├── client/           # React SPA
│   ├── src/
│   │   ├── pages/    # Dashboard, Homework, CheckIn, PetShop, ParentDashboard
│   │   ├── components/ # NavBar, PetDisplay, CheckInCalendar, CoinAnimation
│   │   ├── hooks/    # useAuth, usePet, useCheckIn
│   │   ├── api/      # API client
│   │   └── App.tsx
│   └── package.json
├── docker-compose.yml
└── README.md
```

## License

MIT
