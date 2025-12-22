# HealthHub
**Scope**: This README replaces prior selected overview docs

## Overview
Personal health and habit dashboard hosted at healthhub.theespeys.com with automated data pipeline from multiple health/fitness apps. Features six core panels (Readiness & Recovery, Nutrition, Hydration, Training Load, Habits, Milestones) with interactive habit check-offs, milestone rewards, and automated Cloud Functions fetching data every 2 hours. Includes comprehensive Apple Health integration with raw data verification and macro tracking. **Public demo mode available** - visitors can view the dashboard with mock data without authentication; sign-in required to access personal data.

## Live and Admin
- 🌐 **App URL**: https://healthhub.theespeys.com
- 🔥 **Firebase Console**: healthhub-d43d3
- 🚀 **Netlify Dashboard**: espeyhealthhub
- 📊 **Lovable Project**: Health dashboard development platform
- 🔐 **Auth Roles**: Admin (Brady) & Viewer (Jenny)
- ⏰ **GitHub Actions**: Weekly database backup (Wednesday 12:00 AM CT)

## Tech Stack
- ⚛️ **Frontend**: React 18 + Vite + TypeScript + Tailwind CSS
- 🎨 **UI**: shadcn/ui component library + Framer Motion animations
- 🔥 **Backend**: Firebase (Auth, Firestore, Cloud Functions, Cloud Messaging)
- 📊 **Data Viz**: Recharts for charts and analytics
- 🔐 **Auth**: Firebase Google OAuth with email restrictions
- 🎯 **Layout**: Drag-and-drop layouts via @dnd-kit with Firestore persistence
- 📱 **PWA**: Progressive Web App with offline support

## Quick Start
```bash
git clone https://github.com/bradyespey/health-hub
cd HealthHub
npm install

# Install 1Password CLI (if not already installed)
brew install --cask 1password-cli

# Set up 1Password Environment (see Environment section below)
npm run dev
```

## Environment

**All projects use 1Password Developer Environments for local environment variables.** This allows seamless setup on any computer without managing local `.env` files.

### 1Password Setup

1. **Enable 1Password Developer**:
   - Open 1Password desktop app
   - Settings → Developer → Turn on "Show 1Password Developer experience"

2. **Create Environment**:
   - Go to Developer → Environments (Espey Family account)
   - Create new environment: `HealthHub`
   - Import `.env` file or add variables manually

3. **Install 1Password CLI**:
   ```bash
   brew install --cask 1password-cli
   ```

4. **Run Project**:
   ```bash
   npm run dev
   ```
   - The `dev` script uses `op run --env-file=.env -- vite` to automatically load variables from 1Password
   - No local `.env` file needed

### Required Environment Variables

All variables should be stored in your 1Password Environment:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=YOUR_API_KEY
VITE_FIREBASE_AUTH_DOMAIN=healthhub-d43d3.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=healthhub-d43d3
VITE_FIREBASE_STORAGE_BUCKET=healthhub-d43d3.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=YOUR_SENDER_ID
VITE_FIREBASE_APP_ID=YOUR_APP_ID

# Health App API Keys
VITE_HABITIFY_API_KEY=YOUR_HABITIFY_KEY

# Google Drive Backup (Cloud Functions)
GOOGLE_PROJECT_ID=YOUR_PROJECT_ID
GOOGLE_PRIVATE_KEY_ID=YOUR_PRIVATE_KEY_ID
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n" # Single line with \n escapes
GOOGLE_CLIENT_EMAIL=health-hub-backup@YOUR_PROJECT.iam.gserviceaccount.com
GOOGLE_CLIENT_ID=YOUR_CLIENT_ID
```

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
- 📦 **Backup**: Manual and automated Google Drive backups via admin panel

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
- 📊 **Dashboard** (`/`): Draggable grid with all six health panels and resizable cards. **Public access** - shows mock data for unauthenticated users
- 🎯 **Goals** (`/goals`): Mission 185 weight tracker with line graph, scratch-off prize logging, long-term plans, and 30-day challenges
- 💪 **Readiness** (`/readiness`): Apple Health HRV trends and recovery metrics with demo mode support
- 🍎 **Nutrition** (`/nutrition`): Apple Health calories and macro tracking with demo mode support
- 💧 **Hydration** (`/hydration`): Water intake tracking with week-by-week navigation and date ranges. Demo mode shows realistic mock data
- 🏃 **Training** (`/training`): Apple Watch workouts with RPE entry. Demo mode shows sample workout calendar
- ✅ **Habits** (`/habits`): Habitify analytics with streak counters and completion patterns. Falls back to mock data when API key unavailable
- 🏆 **Milestones** (`/milestones`): Weight loss goals with reward popup cards
- ⚙️ **Admin** (`/admin`): Layout presets, navigation management, backup/restore system, raw Apple Health data verification (authenticated users only)

## Directory Map
```
HealthHub/
├── src/
│   ├── components/
│   │   ├── dashboard/       # Six health panels + draggable grid system
│   │   ├── layout/          # Sidebar, header, mobile nav with theme toggle
│   │   ├── admin/           # Admin panel, backup manager, Apple Health test
│   │   ├── auth/            # Firebase Google sign-in
│   │   └── ui/              # shadcn/ui components + rich text editor
│   ├── contexts/            # Auth, Layout, Navigation, Sidebar contexts
│   ├── services/            # Apple Health and Habitify API services
│   ├── hooks/               # SWR data hooks and custom utilities
│   └── utils/               # Panel helpers and page info utilities
├── functions/src/           # Firebase Cloud Functions for automation
├── docs/                    # Project documentation and guides
└── firebase.json           # Firebase configuration
```

## Troubleshooting
- 🔐 **Auth Issues**: Verify Firebase authorized domains include both production URLs
- 📱 **PWA Install**: Check manifest.json and service worker registration
- 🔄 **Data Sync**: Monitor Cloud Functions logs for API failures and retry logic
- 🎨 **Layout Issues**: Use admin panel to reset layouts or restore from backup
- 📊 **Health Data**: Health Auto Export app required for Apple Health integration (see docs/Apple Health Setup Guide.md)
- 🗂️ **Data Sources**: Apple Health is the primary source for nutrition, hydration, training, and weight data (Lose It! and Athlytic APIs unavailable)
- 💾 **Backup/Restore**: Google Drive integration requires service account setup
- 🔔 **Notifications**: Firebase Cloud Messaging needs proper permissions and tokens

## AI Handoff
Read this README, scan the repo, prioritize core functions and env-safe areas, keep env and rules aligned with this file. Focus on health data integration, drag-and-drop layout system, and automated backup functionality. The rich text editor system uses Tiptap with custom spacing rules.