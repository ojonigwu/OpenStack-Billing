# Active Context: Next.js Starter Template

## Current State

**Template Status**: ✅ Ready for development

The template is a clean Next.js 16 starter with TypeScript and Tailwind CSS 4. It's ready for AI-assisted expansion to build any type of application.

## Recently Completed

- [x] Base Next.js 16 setup with App Router
- [x] TypeScript configuration with strict mode
- [x] Tailwind CSS 4 integration
- [x] ESLint configuration
- [x] Memory bank documentation
- [x] Recipe system for common features
- [x] OpenStack Billing System implemented with full DB schema, pages, and seed data

## Current Structure

| File/Directory | Purpose | Status |
|----------------|---------|--------|
| `src/app/page.tsx` | Billing Dashboard | ✅ Ready |
| `src/app/layout.tsx` | Root layout with Navbar | ✅ Ready |
| `src/app/globals.css` | Global styles | ✅ Ready |
| `src/app/projects/page.tsx` | Projects list | ✅ Ready |
| `src/app/projects/[id]/page.tsx` | Project detail | ✅ Ready |
| `src/app/resources/page.tsx` | Resources list | ✅ Ready |
| `src/app/invoices/page.tsx` | Invoices list | ✅ Ready |
| `src/app/invoices/[id]/page.tsx` | Invoice detail | ✅ Ready |
| `src/app/pricing/page.tsx` | Pricing catalog | ✅ Ready |
| `src/components/layout/Navbar.tsx` | Navigation bar | ✅ Ready |
| `src/db/schema.ts` | DB schema (6 tables) | ✅ Ready |
| `src/db/index.ts` | DB client | ✅ Ready |
| `src/db/migrate.ts` | Migration runner | ✅ Ready |
| `src/lib/seed.ts` | Seed data | ✅ Ready |
| `drizzle.config.ts` | Drizzle config | ✅ Ready |
| `.kilocode/` | AI context & recipes | ✅ Ready |

## Database Schema

- `projects` — OpenStack tenants with credit limits and balances
- `resource_types` — Pricing catalog (compute, storage, network)
- `resources` — Running VM/volume/network instances per project
- `usage_records` — Hourly billing snapshots
- `invoices` — Monthly invoices with status tracking
- `payments` — Payment transaction records

## Current Focus

OpenStack Billing System is fully implemented. Features:
- Dashboard with revenue stats, recent invoices, project summaries
- Projects management with credit usage bars
- Resources tracking by category with hourly cost estimates
- Invoice management with detail view and payment history
- Pricing catalog with monthly estimates
- Dark theme UI with orange accent colors

## Quick Start Guide

### To add a new page:

Create a file at `src/app/[route]/page.tsx`:
```tsx
export default function NewPage() {
  return <div>New page content</div>;
}
```

### To add components:

Create `src/components/` directory and add components:
```tsx
// src/components/ui/Button.tsx
export function Button({ children }: { children: React.ReactNode }) {
  return <button className="px-4 py-2 bg-blue-600 text-white rounded">{children}</button>;
}
```

### To add a database:

Follow `.kilocode/recipes/add-database.md`

### To add API routes:

Create `src/app/api/[route]/route.ts`:
```tsx
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ message: "Hello" });
}
```

## Available Recipes

| Recipe | File | Use Case |
|--------|------|----------|
| Add Database | `.kilocode/recipes/add-database.md` | Data persistence with Drizzle + SQLite |

## Pending Improvements

- [ ] Add more recipes (auth, email, etc.)
- [ ] Add example components
- [ ] Add testing setup recipe

## Session History

| Date | Changes |
|------|---------|
| Initial | Template created with base setup |
