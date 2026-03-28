# LMS (Live Media Sharing)

LMS is an event-focused live media platform where people can create events, invite participants, chat in real time, and build collaborative media galleries during the event window.

It is built as a full-stack monorepo with:
- A Node.js + Express backend for APIs, authentication, media handling, WebSockets, and payments
- A Next.js App Router frontend for public event pages, authenticated dashboards, gallery UX, and checkout flows

## Project Overview

LMS is designed around real event timelines.

- Event Management: Create and manage events with shareable public links.
- Gallery Experience: Upload and browse event media in a time-gated gallery.
- Real-time Chat: Event-based group chat using WebSockets.
- Payments and Upgrades: Stripe checkout for Premium and Pro tier upgrades.

The platform supports both registered users and guest participation (where applicable), while enforcing upload windows and tier policies.

## Tech Stack

### Backend
- Node.js
- Express
- MongoDB + Mongoose
- Socket.io
- Cloudinary
- Nodemailer
- Stripe Node SDK

### Frontend
- Next.js (App Router, 15+; currently Next 16 in this repo)
- TypeScript
- Tailwind CSS
- Socket.io-client
- Stripe.js SDK (`@stripe/stripe-js`)

## Project Structure

This repository is organized as a monorepo with separate backend and frontend applications.

```text
lms/
	backend/
		config/         # External integrations and app-level config (Cloudinary, mail, socket)
		controllers/    # Request/response handlers for API routes
		database/       # MongoDB connection setup
		middleware/     # Auth, request identity, upload handling
		models/         # Mongoose schemas (users, events, media, chats, memberships)
		routes/         # Express route declarations
		services/       # Core business logic used by controllers
		utils/          # Helper utilities (JWT/token, email helpers, timeline checks)
		server.js       # Express + Socket.io bootstrap

	frontend/
		public/         # Static assets
		src/app/        # Next.js App Router pages/layouts
		src/components/ # Reusable UI components
		src/context/    # React context providers (identity/user state)
		src/hooks/      # Custom hooks (chat/gallery socket subscriptions)
		src/lib/        # API client and integration wrappers
		src/types/      # Shared TypeScript domain types
		src/styles/     # Global styles and font setup
```

### Architecture Notes
- Controllers: Validate request shape and map HTTP concerns to services.
- Services: Own business rules (event lifecycle checks, Stripe upgrade logic, media operations).
- Hooks (frontend): Encapsulate real-time client behavior (`useChatSocket`, `useGallerySocket`).
- App Router: Organizes public pages, auth flow, and authenticated dashboard paths by route groups.

## Key Features

### 1) Event Management
- Create, edit, and manage events as the host.
- Public event pages by slug for easy sharing.
- Event status and timeline-aware access checks.

### 2) Real-time Chat
- Event-scoped group messaging over Socket.io.
- Join/leave room semantics based on event context.
- Persisted chat messages for continuity.

### 3) Media Gallery
- Cloudinary-backed uploads for event galleries.
- Event-window validation before accepting uploads.
- Host/uploader moderation actions (delete/label/highlights where enabled).
- Tier-aware media limits and retention behavior.

### 4) Payment Sharing
- Stripe Checkout for one-time event upgrades.
- Premium and Pro lookup-key based pricing.
- Webhook + confirmation flow to apply upgrades and limits.

### 5) Auth Sharing
- JWT-based authentication.
- Protected routes for host and member operations.
- Account activation and password reset flow via email.

## Business Logic (Tiers)

LMS enforces both retention and active upload windows per tier.

- Free tier:
	- Gallery lifecycle: saved for 7 days.
	- Active upload window: 24 hours.
- Premium tier:
	- Gallery lifecycle: saved for 1 month.
	- Active upload window: up to 7 days.
- Pro tier:
	- Gallery lifecycle: saved for 1 year.
	- Active upload window: up to 3 months.

In the backend, upload authorization is also guarded by real event timeline checks (`startTime` to `endTime`) and event status.

## Installation and Setup

### 1) Clone Repository

```bash
git clone https://github.com/nl-codes/lms---Event-Media-Sharing-Website.git
cd lms
```

### 2) Install Dependencies

Install backend dependencies:

```bash
cd backend
npm install
```

Install frontend dependencies:

```bash
cd ../frontend
npm install
```

### 3) Configure Environment Variables

Create `.env` files from the existing examples in both apps:

```bash
# from repo root
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

#### Backend `.env` (required)

```env
DB_CONNECTION_STRING=
PORT=
JWT_SECRET_KEY=

MAILTRAP_HOST=
MAILTRAP_PORT=
EMAIL_FROM=
MAILTRAP_USER=
MAILTRAP_PASS=

FRONTEND_URL=
BACKEND_URL=

NODE_ENV=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

#### Frontend `.env` (required)

```env
NEXT_PUBLIC_BACKEND_URL=
NEXT_PUBLIC_FRONTEND_URL=
JWT_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

Suggested local defaults:
- Frontend URL: `http://localhost:8080`
- Backend URL: `http://localhost:5000` (or your configured backend port)

### 4) Run the Applications

Start backend:

```bash
cd backend
npm run dev
```

Start frontend (new terminal):

```bash
cd frontend
npm run dev
```

Open the app at `http://localhost:8080`.

## Available Scripts

### Backend
- `npm run dev` - run with nodemon
- `npm start` - run with Node.js

### Frontend
- `npm run dev` - run Next.js dev server (port 8080)
- `npm run build` - production build
- `npm run start` - start production server
- `npm run lint` - run ESLint

## Stripe Notes (Development)

To test webhook-driven upgrades locally, use Stripe CLI forwarding to your backend webhook route (configured under `/webhooks`).

Example:

```bash
stripe listen --forward-to localhost:5000/webhooks
```

Then set `STRIPE_WEBHOOK_SECRET` from Stripe CLI output.

## Roadmap Ideas

- Event analytics dashboards (engagement, uploads, retention)
- Moderation workflows with role-based permissions
- Export and archival tooling for enterprise event hosts

## License
