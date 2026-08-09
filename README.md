# HealthHub
**Scope**: This README replaces prior selected overview docs

## Overview
Personal health and habit dashboard hosted at healthhub.theespeys.com with automated data pipeline from multiple health/fitness apps. Features six core panels (Readiness & Recovery, Nutrition, Hydration, Training Load, Habits, Milestones) with interactive habit check-offs, milestone rewards, and automated Cloud Functions fetching data every 2 hours. Includes comprehensive Apple Health integration with raw data verification and macro tracking. **Public demo mode available** - visitors can view the dashboard with mock data without authentication; sign-in required to access personal data. Uses a fixed flow layout system for consistent, readable data presentation across all pages.

## Live and Admin
- 🌐 **App URL**: https://healthhub.theespeys.com
- 🔥 **Firebase Console**: healthhub-d43d3
- 🚀 **Netlify Dashboard**: espeyhealthhub
- 📊 **Lovable Project**: Health dashboard development platform
- 🔐 **Auth Roles**: Admin (Brady) & Viewer (Jenny)
- ⏰ **GitHub Actions**: Weekly database backup (Wednesday 12:00 AM CT)

## Tech Stack
- ⚛️ **Frontend**: React 19 + Vite 8 + TypeScript 6 + Tailwind CSS 3
- 🎨 **UI**: shadcn/ui component library + Framer Motion animations
- 🔥 **Backend**: Firebase (Auth, Firestore, Cloud Functions, Cloud Messaging)
- 📊 **Data Viz**: Recharts for charts and analytics
- 🔐 **Auth**: Firebase Google OAuth with email restrictions
- 🎯 **Layout**: Fixed flow layout system with consistent card sizing and vertical flow
- 📱 **PWA**: Progressive Web App with offline support

## Quick Start
```bash
git clone https://github.com/bradyespey/health-hub
cd HealthHub
npm install
npm run dev
```

## Environment

Copy `.env.example` to `.env` and fill in values. See `.env.example` for all required variables.

### Required Environment Variables

All variables should be set in `.env` (copy from `.env.example`):


```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=YOUR_API_KEY
VITE_FIREBASE_AUTH_DOMAIN=healthhub-d43d3.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=healthhub-d43d3
VITE_FIREBASE_STORAGE_BUCKET=healthhub-d43d3.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=YOUR_SENDER_ID
VITE_FIREBASE_APP_ID=YOUR_APP_ID
```

Habitify calls go through a server-side proxy (`habitifyProxy` Firebase Function) — the real API key lives in Firebase Secret Manager (`HABITIFY_API_KEY`), not the client bundle. Nothing to set in `.env` for it.

## Run Modes (Debug, Headless, Profiles)
- 🐛 **Debug Mode**: `npm run dev` with browser dev tools and Firebase emulator
- 📱 **PWA Mode**: Installable app with offline capabilities and push notifications
- 🌐 **Production Mode**: Deployed via Netlify with Firebase Cloud Functions

## Scripts and Ops
- 🔧 **Development**: `npm run dev` — Start local development server
- 🏗️ **Build**: `npm run build` — Production build with TypeScript compilation
- 🔍 **Lint**: `npm run lint` — ESLint code checking
- 👀 **Preview**: `npm run preview` — Preview production build
- 🔥 **Deploy Functions**: `firebase deploy --only functions` — Deploy Cloud Functions
### Data Pipeline Automation
- ⏰ **Cloud Functions**: Cron every 2h fetches Habitify data
- 📱 **Health Auto Export**: Automated Apple Health exports (weight, hydration, HRV, workouts, nutrition, readiness) via REST API to Firebase Function
- 🔔 **Push Notifications**: 8 PM reminders for incomplete habits (Firebase Cloud Messaging)
- 🔄 **Sync Status**: Monitoring with failure alerts and manual retry options
- ⚖️ **Weight Tracking**: Apple Health BodyMass data synced to Firestore for Mission 185 progress visualization
- 🍎 **Nutrition Tracking**: Apple Health dietary calories with day-by-day navigation and macro percentages
- 💧 **Hydration Monitoring**: Apple Health water intake with week-by-week navigation and date range display
- 🏃 **Training Load**: Apple Health exercise time and active calories with calendar view
- 🔍 **Raw Data Verification**: Admin panel displays raw Apple Health data with filtering and formatting

## Deploy
- 🚀 **Frontend**: Automatic via GitHub integration to Netlify
- 📦 **Build Command**: `npm run build`
- 📁 **Publish Directory**: `dist`
- 🌐 **Domains**: healthhub.theespeys.com (primary), espeyhealthhub.netlify.app
- 🔥 **Functions**: Firebase Cloud Functions in us-south1 (Dallas)

## App Pages / Routes
- 📊 **Dashboard** (`/`): Fixed flow layout with all health panels and goal cards. Shows Habits, Milestone Progress, Readiness, Nutrition, Hydration, Training, and all Goals cards (Long-term Goal, 30-Day Challenge, Mission 185, Scratch-Off Prizes). Includes aggregated notes from all pages. **Public access** - shows mock data for unauthenticated users (demo mode)
- 🎯 **Goals** (`/goals`): Mission 185 weight tracker with line graph, scratch-off prize logging, long-term plans, and 30-day challenges. Includes page-specific notes
- 💪 **Readiness** (`/readiness`): Apple Health HRV trends and recovery metrics with demo mode support. Includes page-specific notes
- 🍎 **Nutrition** (`/nutrition`): Apple Health calories and macro tracking with demo mode support. Includes page-specific notes
- 💧 **Hydration** (`/hydration`): Water intake tracking with week-by-week navigation and date ranges. Demo mode shows realistic mock data. Includes page-specific notes
- 🏃 **Training** (`/training`): Apple Watch workouts with RPE entry. Demo mode shows sample workout calendar. Includes page-specific notes
- ✅ **Habits** (`/habits`): Habitify analytics with streak counters and completion patterns. Falls back to mock data when API key unavailable. Includes page-specific notes
- ⚙️ **Admin** (`/admin`): Navigation menu order management, backup/restore system, raw Apple Health data verification (authenticated users only)

## Directory Map
```
HealthHub/
├── src/
│   ├── components/
│   │   ├── dashboard/       # Health panels + fixed flow grid system + goal cards + page notes
│   │   ├── layout/          # Sidebar, header, mobile nav with theme toggle
│   │   ├── admin/           # Admin panel, backup manager, Apple Health test
│   │   ├── auth/            # Firebase Google sign-in
│   │   └── ui/              # shadcn/ui components + rich text editor + page info popover
│   ├── contexts/            # Auth, Layout, Navigation, Sidebar contexts
│   ├── services/            # Apple Health, Habitify API, TextCard (notes), and backup services
│   ├── hooks/               # SWR data hooks and custom utilities
│   └── utils/               # Panel helpers and page info utilities
├── functions/src/           # Firebase Cloud Functions for automation
├── docs/                    # Project documentation and guides
└── firebase.json           # Firebase configuration
```

## Key Features

### Layout System
- **Fixed Flow Layout**: Consistent vertical flow of cards across all pages (no drag-and-drop)
- **Card Sizing**: Standardized medium-sized cards with consistent spacing
- **Dashboard Aggregation**: Dashboard page shows all health panels plus all goal cards from the Goals page
- **Page Notes**: Editable notes system (admin-only) scoped per page, with dashboard showing aggregated notes from all pages

### Demo Mode
- **No Firebase Required**: App runs in demo mode when `VITE_FIREBASE_API_KEY` is not set
- **Mock Data**: Realistic mock data displayed for all panels when Firebase is unavailable
- **Graceful Degradation**: All services handle null Firebase instances gracefully

### Page Info System
- **Popover Help**: Page info button in header navigation opens contextual help via popover
- **Per-Page Tips**: Each page has specific usage tips and instructions

## Health Auto Export Setup
Apple Health data reaches HealthHub via the [Health Auto Export](https://www.healthexportapp.com) iOS app, configured as a REST API automation ([official REST API automation docs](https://help.healthyapps.dev/en/health-auto-export/automations/rest-api/)):
- **Automation Type**: REST API
- **URL**: the `ingestAppleHealth` Cloud Function URL (`firebase functions:list --project healthhub-d43d3`)
- **Header**: `x-ingest-secret` → value from 1Password ("HealthHub Environment Variables" → `HEALTH_INGEST_SECRET`). Required as of 2026-08-08 — the endpoint returns 401 without it.
- **Data Type**: Health Metrics, all metrics selected
- **Export Format**: JSON, Export Version v2
- **Sync Cadence**: hourly is plenty; the function batches and dedupes on write

If `HEALTH_INGEST_SECRET` is ever rotated, update it in both Firebase Secret Manager (`firebase functions:secrets:set HEALTH_INGEST_SECRET`) and the Health Auto Export app's header value, or the automated sync will start failing with 401s.

## Troubleshooting
- 🔐 **Auth Issues**: Verify Firebase authorized domains include both production URLs. App runs in demo mode if Firebase not configured
- 📱 **PWA Install**: Check manifest.json and service worker registration
- 🔄 **Data Sync**: Monitor Cloud Functions logs for API failures and retry logic
- 📊 **Health Data**: Health Auto Export app required for Apple Health integration (see "Health Auto Export Setup" above)
- 🗂️ **Data Sources**: Apple Health is the primary source for nutrition, hydration, training, and weight data (Lose It! and Athlytic APIs unavailable)
- 🔔 **Notifications**: Firebase Cloud Messaging needs proper permissions and tokens
- 🎨 **Layout**: Fixed flow layout - customization done via code changes, not UI

## AI Handoff
Read this README, scan the repo, prioritize core functions and env-safe areas, keep env and rules aligned with this file. Focus on health data integration, fixed flow layout system, page notes system, and automated backup functionality. The rich text editor system uses Tiptap with custom spacing rules. The app supports demo mode when Firebase is not configured - all services handle null Firebase instances gracefully.
