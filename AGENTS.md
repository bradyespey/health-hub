# Project Context

Read README.md for full project context before making changes.

## Overview
Personal health dashboard aggregating readiness, nutrition, hydration, training, habits, and milestone data with scheduled automation and demo mode.

## Stack
React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, Framer Motion, Recharts, Firebase Auth/Firestore/Functions/FCM, Netlify.

## Key Files
- src/components/dashboard/
- src/services/
- src/hooks/
- functions/src/
- firebase.json

## Dev Commands
- Start: npm run dev
- Build: npm run build
- Deploy: firebase deploy --only functions

## Local Ports
- App dev: `http://localhost:5176`
- Netlify local shell: not reserved for this repo right now

## Rules
- Do not introduce new frameworks
- Follow existing structure and naming
- Keep solutions simple and fast

## Notes
- App supports demo mode when Firebase config is missing.
- Keep fixed-flow layout system and page-notes behavior consistent.
