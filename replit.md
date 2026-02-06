# CleanOps - Internal Cleaning Business Prototype

## Overview
Internal ops prototype for a cleaning business that solves three problems:
1. Pricing drift (prices change after booking)
2. Disappearing jobs (recurring jobs silently deleted)
3. Unreliable clock-in/out tracking

## Core Principles
- Jobs are immutable - pricing locked at creation
- Subscriptions only schedule jobs, never mutate them
- Clock-in/out is manual button-press only

## Architecture
- Frontend: React + Vite + shadcn/ui + TanStack Query + wouter
- Backend: Express + Drizzle ORM + PostgreSQL
- No auth (single-user demo)

## Data Models
- **Customer**: id, name, address
- **Subscription**: id, customerId, frequency, startDate, status
- **Job**: id, customerId, subscriptionId?, scheduledDate, arrivalWindow, priceSnapshot (locked), extrasSnapshot, status
- **TimeLog**: id, jobId, clockInTime, clockOutTime, lat, lng

## Screens
1. `/book` - Booking & Pricing (two-column form + summary)
2. `/jobs/:id` - Job Detail (read-only locked pricing)
3. `/jobs` - All Jobs list
4. `/subscriptions` - Subscriptions list
5. `/subscriptions/:id` - Subscription detail + job list
6. `/schedule` - Weekly calendar view
7. `/tech` - Tech clock-in/out (mobile-first)

## Key Files
- `shared/schema.ts` - Data models, pricing config, calculatePrice()
- `server/routes.ts` - All API endpoints
- `server/storage.ts` - Database CRUD layer
- `server/seed.ts` - Seed data on first run
- `client/src/pages/` - All page components
- `client/src/components/app-sidebar.tsx` - Navigation sidebar
