# LMS (Live Media Sharing)

LMS is a full-stack event media sharing platform for creating events, inviting participants, collecting photos/videos, chatting in real time, and preserving event memories through collaborative galleries.

It is built as a monorepo with:

- **Backend:** Node.js, Express, MongoDB/Mongoose, Socket.IO, BullMQ, Cloudinary, Stripe, Nodemailer
- **Frontend:** Next.js App Router, React, TypeScript, Tailwind CSS, Socket.IO client, Stripe.js

## Project Overview

LMS is designed around real event timelines and tier-based access.

- Hosts create events and share QR/public links.
- Registered users and guests can join event galleries.
- Participants upload event media during the allowed upload window.
- Viewers see real-time gallery updates, likes, comments, chat messages, and notifications.
- Admins moderate users, events, media, comments, reports, and appeals.
- Background workers handle slow or recurring work such as video processing, emails, highlights, privacy sync, lifecycle sync, and media retention.

## Tech Stack

### Backend

- Node.js + Express 5
- MongoDB Atlas / Mongoose
- Socket.IO
- BullMQ + Redis / Upstash-compatible Redis
- Cloudinary signed uploads
- Stripe Checkout + webhooks
- Nodemailer SMTP email queue
- JWT auth with HTTP-only cookies
- Sharp, ffmpeg-static, Transformers.js for media/background pipelines

### Frontend

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Socket.IO client
- Stripe.js
- Chart.js / react-chartjs-2
- lucide-react icons
- react-hot-toast

## Project Structure

```text
lms/
  backend/
    config/          # Cloudinary, Redis, Nodemailer, Socket.IO holder
    constants/       # Tier limits and shared backend constants
    controllers/     # HTTP request/response handlers
    database/        # MongoDB connection setup
    middleware/      # Auth, optional identity, multer/upload gates
    models/          # Mongoose models
    queues/          # BullMQ queues and worker bootstraps
    routes/          # Express routers
    scripts/         # Superadmin setup and migrations
    services/        # Business logic and processors
    utils/           # Auth helpers, validators, email templates, media helpers
    server.js        # Express + Socket.IO + worker bootstrap

  frontend/
    public/          # Static assets
    src/app/         # Next.js App Router pages
    src/components/  # Reusable UI components
    src/config/      # Backend/socket config
    src/context/     # User and identity context
    src/hooks/       # Gallery/chat/socket/shared hooks
    src/lib/         # API clients and integration helpers
    src/styles/      # Global CSS and fonts
    src/types/       # TypeScript domain types
    src/utils/       # Client utilities
```

## Core Subsystems

### User Management

- User signup, activation, reactivation, login, logout
- Forgot password and reset password
- JWT cookie authentication
- Profile creation/editing
- Profile pictures and shared `UserAvatar` rendering
- Public profile viewing
- Status handling: `pending`, `active`, `suspended`
- Unsuspend appeal flow for suspended users

### Event Management

- Host event creation and editing
- Tier-derived event end time
- Public/private event privacy
- Public event pages by slug
- QR code invitation links
- Registered membership and guest participation
- Participant list
- Host event controls: edit, gallery, QR, insights, finish event, invite users
- Event not-found handling
- Event suspension by admin with required reason
- Event appeal flow for suspended events

### Media Management

- Image and video upload to event galleries
- Cloudinary-backed media storage
- Image compression and validation
- Video background processing with BullMQ
- Gallery views for host/private and public routes
- Real-time `new_media`, `media_deleted`, and `media_liked` socket updates
- Media detail page with likes, comments, liked-by list, and comment modal
- Explore feed for public media with infinite scrolling
- Explore media cards with like count
- Host media moderation: delete, label, mark/unmark highlight
- Download selected/all media as zip
- Duplicate/similar media and gallery award support where implemented

### Interaction System

- Unified `Interaction` model for likes and comments
- Real-time like count synchronization
- Guest users can view counts, registered users can like/comment
- Comment edit/delete support
- Report actions for media, comments, and users

### Chat Management

- Event-scoped chat rooms via Socket.IO
- Registered-user chat participation
- Persisted chat messages
- Read tracking through `EventMembership.lastSeenChatAt`
- Unread chat count support

### Notification Management

- In-app notification bell
- Unread count and mark-read/mark-all-read
- Notifications for reports, moderation actions, invites, event endings, event suspension, appeals, and account suspension
- Clickable notification links
- Event invite notifications route users to the public event page
- Event-ended notifications route participants to the event gallery

### Report and Appeal Management

- Report media, comments, and users
- Admin report queue
- Verify/dismiss reports
- Admin actions: hide media, delete comment, suspend user
- Required reasoning for user/event suspension
- User suspension email with appeal link
- Unsuspend appeal review queue
- Event suspension appeal review queue
- Admin approve/reject appeal actions
- Host notification when event appeal is approved/rejected

### Payment Management

- Stripe Checkout for Premium and Pro upgrades
- Upgrade during event creation, with event creation finalized only after successful checkout
- Upgrade existing free events
- Stripe webhook support
- Static production pricing page with rate-limit table and no checkout behavior
- Payment success back-navigation handling to avoid returning to Stripe sandbox

### Admin and Superadmin Management

- Admin signup and login
- Admin MFA/OTP login flow
- Superadmin approval and management of admin accounts
- Admin dashboards for:
  - users
  - events
  - reports
  - appeals
  - insights
- Admin sidebar pending badges for reports and appeals
- Admin user suspension with required reason and queued email
- Admin event suspension with required reason and host notification

### Background Subsystem

- Email queue for activation, reset, admin OTP, suspension, and appeal emails
- Video processing queue
- AI highlight queue for paid event highlights
- Event privacy queue to sync event privacy to media `isPublic`
- Event cleanup queue
- Event lifecycle sync queue
- Media retention queue
- Startup sync for completed events, expired upgrades, participant counts, highlight backlog, and media retention backlog

## Event Tiers and Limits

LMS separates **upload window** from **media retention**.

### Upload Window

- **Free:** `startTime + 24 hours`
- **Premium:** `startTime + 1 week`
- **Pro:** `startTime + 1 month`

The backend calculates `endTime`; clients do not submit or edit it.

### Upload Limits

| Limit | Free | Premium | Pro |
|---|---:|---:|---:|
| File size (image + video) | 5 MB | 50 MB | 500 MB |
| Upload limit | 100 | 500 | 10000 |

### Media Retention

Retention starts after `event.endTime`.

- **Free:** delete media after 7 days
- **Premium:** delete media after 1 month
- **Pro:** delete media after 3 months

The event document is kept after retention. Media, interactions, and Cloudinary assets are removed.

## Key Routes

### Public

- `/`
- `/events/[slug]`
- `/events/[slug]/gallery`
- `/media/[id]`
- `/pricing`
- `/pricing/production`
- `/report/[id]`
- `/request/unsuspend`

### Auth

- `/login`
- `/signup`
- `/signup/activate`
- `/signup/reactivate`
- `/forgot-password`
- `/reset-password`

### User Dashboard

- `/home`
- `/home/events`
- `/home/events/create`
- `/home/events/[id]`
- `/home/events/[id]/edit`
- `/home/events/[id]/gallery`
- `/home/events/[id]/insights`
- `/home/events/[id]/participants`
- `/home/events/[id]/upgrade`
- `/home/explore`
- `/home/profile`
- `/home/profile/create`
- `/home/profile/edit`
- `/home/profile/[id]/others`

### Admin

- `/admin/login`
- `/admin/signup`
- `/admin/home`
- `/admin/users`
- `/admin/events`
- `/admin/events/[id]`
- `/admin/reports`
- `/admin/appeals`
- `/admin/insights`

### Superadmin

- `/superadmin/home`
- `/superadmin/admin/approve`
- `/superadmin/admin/manage`

## Backend API Areas

Mounted routers include:

- `/users`
- `/users/profile`
- `/events`
- `/media`
- `/event-memberships`
- `/chats`
- `/payments`
- `/admins`
- `/superadmins`
- `/interactions`
- `/reports`
- `/notifications`
- `/appeals`
- `/webhooks`

## Real-time Socket Flow

Socket.IO is used for:

- Gallery rooms: `join_gallery`, `leave_gallery`
- Gallery events: `new_media`, `media_deleted`, `media_liked`
- Chat rooms: `join_chat_room`, `leave_chat_room`
- Chat events: `send_message`, `receive_message`
- Read tracking: `mark_as_read`

Production socket CORS must allow the frontend origin and credentials.

## Installation and Setup

### 1) Clone Repository

```bash
git clone https://github.com/nl-codes/LMS-Event-Media-Sharing-Website.git
cd LMS-Event-Media-Sharing-Website
```

### 2) Install Dependencies

Backend:

```bash
cd backend
npm install
```

Frontend:

```bash
cd ../frontend
npm install
```

### 3) Configure Environment Variables

Create env files from examples:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### Backend `.env`

```env
NODE_ENV=
PORT=

DB_CONNECTION_STRING=
JWT_SECRET_KEY=
COOKIE_DOMAIN=

REDIS_URL=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

MAILTRAP_HOST=
MAILTRAP_PORT=
MAILTRAP_USER=
MAILTRAP_PASS=
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=

STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

DISABLE_HIGHLIGHT_WORKER=

FRONTEND_URL=
BACKEND_URL=
```

### Frontend `.env`

```env
NEXT_PUBLIC_BACKEND_URL=
NEXT_PUBLIC_FRONTEND_URL=
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
JWT_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

Suggested local defaults:

- Frontend: `http://localhost:8080`
- Backend: `http://localhost:5000` or your configured `PORT`
- `FRONTEND_URL=http://localhost:8080`
- `NEXT_PUBLIC_BACKEND_URL=http://localhost:5000`

## Running Locally

Start backend:

```bash
cd backend
npm run dev
```

Start frontend:

```bash
cd frontend
npm run dev
```

Open:

```text
http://localhost:8080
```

Run frontend on LAN for phone testing:

```bash
cd frontend
npm run lan
```

## Available Scripts

### Backend

- `npm run dev` - start backend with Nodemon
- `npm start` - start backend with Node
- `npm run setup:superadmin` - create the superadmin account

### Frontend

- `npm run dev` - start Next.js dev server on port 8080
- `npm run lan` - start Next.js on `0.0.0.0:8080`
- `npm run build` - production build
- `npm run start` - start production Next.js server
- `npm run lint` - run ESLint

## Stripe Development Notes

Stripe webhooks are mounted under `/webhooks`.

For local testing:

```bash
stripe listen --forward-to localhost:5000/webhooks/stripe
```

Set `STRIPE_WEBHOOK_SECRET` from the Stripe CLI output.

Stripe Price lookup keys expected by the app:

- `premium`
- `pro`

## Production Deployment Notes

The project is designed to deploy on free-tier friendly services:

- Frontend: Vercel
- Backend/API: Render Web Service
- Redis: Upstash Redis
- Database: MongoDB Atlas M0
- Media: Cloudinary
- Payments: Stripe test/standard mode

For same-domain cookie auth in production:

- Frontend: `https://www.lms.samesite.com.np`
- Backend: `https://api.lms.samesite.com.np`
- Backend `COOKIE_DOMAIN=.samesite.com.np`
- Backend `FRONTEND_URL=https://www.lms.samesite.com.np`
- Frontend `NEXT_PUBLIC_BACKEND_URL=https://api.lms.samesite.com.np`

Render free services may sleep after inactivity. The first API/socket request after idle time can take longer.

## TypeScript / VS Code Note

Keep committed `frontend/tsconfig.json` production-safe with:

```json
"ignoreDeprecations": "5.0"
```

For local editor squiggles, use the workspace TypeScript version:

```json
{
  "typescript.tsdk": "frontend/node_modules/typescript/lib"
}
```

## Current Validation Commands

Useful checks before committing:

```bash
cd backend
node --check server.js
```

```bash
cd frontend
npx tsc --noEmit
npm run lint
npm run build
```

## License

ISC
