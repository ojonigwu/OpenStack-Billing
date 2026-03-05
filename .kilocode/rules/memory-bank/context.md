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
- [x] Fixed build failure: replaced `@kilocode/app-builder-db` (remote SQLite proxy) with `@libsql/client` (local file SQLite) — build now succeeds
- [x] Fixed second build error: all pages now use `export const dynamic = 'force-dynamic'` to prevent build-time DB queries (tables don't exist at build time)

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

OpenStack Billing System is fully implemented with live Kolla integration. Features:
- Dashboard with revenue stats, recent invoices, project summaries, OS connection banner
- Projects management with credit usage bars
- Resources tracking by category with hourly cost estimates
- Invoice management with detail view and payment history
- Pricing catalog with monthly estimates
- Dark theme UI with orange accent colors
- **OpenStack Kolla integration**: Keystone auth, Nova, Cinder, Neutron API clients
- **Settings page**: connection config guide, test connection, sync button
- **Sync API**: pulls projects/servers/volumes/floating IPs/LBs into local DB

## OpenStack Integration

### Environment Variables Required
```
OS_AUTH_URL=http://KOLLA_IP:5000
OS_USERNAME=admin
OS_PASSWORD=...
OS_PROJECT_NAME=admin
OS_USER_DOMAIN_NAME=Default
OS_PROJECT_DOMAIN_NAME=Default
OS_REGION_NAME=RegionOne
```

### API Routes
- `GET /api/openstack/test` — test Keystone connection
- `GET /api/openstack/live` — fetch live data (no DB write)
- `POST /api/openstack/sync` — sync OpenStack data into local DB

### Library Files
- `src/lib/openstack/config.ts` — env var config
- `src/lib/openstack/keystone.ts` — token auth + service catalog
- `src/lib/openstack/keystone-admin.ts` — list projects/users
- `src/lib/openstack/nova.ts` — servers, flavors, hypervisor stats
- `src/lib/openstack/cinder.ts` — volumes, volume types
- `src/lib/openstack/neutron.ts` — floating IPs, networks, routers, LBs
- `src/lib/openstack/client.ts` — unified client

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
