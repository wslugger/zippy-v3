# Module 1: Ingestion & Package Selection — Implementation Plan

## Context

Zippy v3 is a fresh Next.js 16 scaffold with comprehensive architecture docs but zero implementation. Module 1 is the SA-facing entry point where Solution Architects create projects, browse service packages, and receive package collateral. This is the foundation everything else builds on.

**Scope:** Project creation, package selection (manual), collateral display.
**Not in scope:** Site requirements forms (later), AI classification (later).

---

## Phase 0: Dev Server Config

Create `.claude/launch.json`:
```json
{
  "version": "0.0.1",
  "configurations": [
    {
      "name": "next-dev",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev"],
      "port": 3000
    }
  ]
}
```

---

## Service Hierarchy (Critical Data Model)

The catalog follows a strict 3-level hierarchy:

```
Service (e.g., "Managed SD-WAN")
  └─ Service Option (e.g., "Cisco Catalyst SD-WAN", "Meraki SD-WAN")
       └─ Design Options (e.g., Topology: Hub & Spoke / Full Mesh; Internet Breakout: Central / Local)
```

**Key rules:**
- Service Options are vendor/platform implementations — the vendor is implicit in the name (no separate vendor field)
- Design Options are grouped by category (Topology, Internet Breakout, etc.) and belong to a Service Option
- A Service can also have Features that apply broadly (e.g., "BGP", "WAN Optimization")
- Packages bundle Services with inclusion logic (required/standard/optional)

---

## Phase 1: Foundation

### Step 1 — Install dependencies
```bash
npm install zod clsx tailwind-merge lucide-react
npm install -D tsx
```

### Step 2 — Initialize shadcn/ui + generate components
```bash
npx shadcn@latest init    # New York style, Zinc, CSS variables
npx shadcn@latest add button card input label textarea badge skeleton separator tooltip
```

### Step 3 — Prisma schema (`prisma/schema.prisma`)

4 models needed for Module 1:

| Model | Collection | Purpose |
|-------|-----------|---------|
| `GlobalTaxonomy` | `system_config` | Singleton with shared vocabularies |
| `Service` | `services` | Service catalog with Service Options → Design Options hierarchy |
| `Package` | `packages` | Service package bundles with collateral |
| `Project` | `projects` | Project Ledger — central state document |

All models use `id String @id @default(auto()) @map("_id") @db.ObjectId`.
Prisma generator outputs to `src/generated/prisma`.

**Service model structure:**
```prisma
model Service {
  id                String   @id @default(auto()) @map("_id") @db.ObjectId
  slug              String   @unique
  name              String              // e.g. "Managed SD-WAN" (category implicit in name)
  shortDescription  String              // Brief summary for cards/lists
  description       String              // Detailed description for HLD
  constraints       String[]            // Caveats/constraints for HLD
  assumptions       String[]            // Assumptions for HLD
  serviceOptions    Json[]              // Array of ServiceOption objects (see below)
  features          String[]            // Service-level features: ["bgp", "wan_optimization"]
  isActive          Boolean  @default(true)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  @@map("services")
}
```

No `category` field — the service name itself implies the category (Managed SD-WAN = WAN, etc.).

**All three levels share the same rich text fields** (for HLD generation):
- `name` — Display name
- `shortDescription` — Brief summary for cards/lists
- `description` — Detailed description for HLD document
- `constraints` — Array of caveats/constraints
- `assumptions` — Array of assumptions

**Features** can exist at the Service level OR the Service Option level (inherited down).

**ServiceOption shape (stored as Json):**
```typescript
{
  optionId: string,              // e.g. "cisco_catalyst_sdwan"
  name: string,                  // e.g. "Cisco Catalyst SD-WAN" (vendor implicit)
  shortDescription: string,
  description: string,
  constraints: string[],
  assumptions: string[],
  features: string[],            // Option-level features (in addition to service-level)
  designOptions: DesignOptionGroup[]
}
```

**DesignOptionGroup shape:**
```typescript
{
  groupId: string,               // e.g. "topology"
  groupLabel: string,            // e.g. "Topology"
  shortDescription: string,
  description: string,
  constraints: string[],
  assumptions: string[],
  selectionType: "single" | "multi",
  choices: {
    value: string,
    label: string,
    shortDescription: string,
    description: string,
    constraints: string[],
    assumptions: string[]
  }[]
}
```

### Step 4 — Push schema + generate client
```bash
npx prisma db push && npx prisma generate
```

### Step 5 — Shared infrastructure (`src/lib/`)

| File | Contents |
|------|----------|
| `prisma.ts` | Singleton PrismaClient (hot-reload safe) |
| `types.ts` | Zod schemas: `CreateProjectSchema`, `UpdateProjectSchema`, `ModuleStatesSchema`, `CollateralSchema`, `ServiceInclusionSchema`, `ServiceOptionSchema`, `DesignOptionGroupSchema`, `DesignOptionChoiceSchema` + inferred TS types. All three catalog levels validated with shared `name`, `shortDescription`, `description`, `constraints[]`, `assumptions[]` fields. |
| `utils.ts` | `cn()` helper (clsx + tailwind-merge) |
| `constants.ts` | UI-only presentation constants: `MODULE_LABELS`, `MODULE_STATE_COLORS`, `COLLATERAL_TYPE_ICONS` |

### Step 6 — Seed script (`prisma/seed.ts`)

Seed data:
- 1 Global Taxonomy singleton (vendors, interfaceTypes, wifiStandards, etc.)
- 5 Services with realistic Service Options and Design Options:
  - **Managed SD-WAN**: Service Options: Cisco Catalyst SD-WAN, Meraki SD-WAN; Design Options: Topology (Hub & Spoke Strict/Dynamic, Full Mesh), Internet Breakout (Central, Local)
  - **Managed LAN**: Service Options: Cisco Catalyst Switching, Meraki Switching; Design Options: Redundancy Mode (Stacking, Standalone), Management Model (Cloud, On-Prem)
  - **Managed WLAN**: Service Options: Meraki Wireless, Cisco Catalyst Wireless; Design Options: Wi-Fi Standard (Wi-Fi 6, 6E, 7), AP Density (Standard, High)
  - **Managed Security (SASE)**: Service Options: Cisco+ Secure Connect, Fortinet SASE; Design Options: Security Tier (Essentials, Advanced, Premium), Inspection Mode (Cloud, Local Breakout)
  - **Dedicated Internet Access**: Service Options: Carrier DIA; Design Options: SLA Tier (Standard, Premium)
- 4 Packages: Cost Optimized, Cloud First, Security First SASE, Performance SASE — each with included services and collateral arrays

Add `"prisma": { "seed": "npx tsx prisma/seed.ts" }` to package.json, then run `npx prisma db seed`.

---

## Phase 2: API Layer

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/taxonomy` | GET | Return global taxonomy singleton |
| `/api/packages` | GET | List all active packages |
| `/api/packages/[packageId]` | GET | Single package detail |
| `/api/projects` | GET, POST | List projects, create new project |
| `/api/projects/[projectId]` | GET, PATCH | Get project, update project |

**Key behavior in PATCH `/api/projects/[projectId]`:**
- Validates with Zod `UpdateProjectSchema`
- Merges partial `moduleStates` updates
- When `selectedPackageId` changes: sets `ingestion: "completed"`, flags downstream modules as `"out_of_date"`
- Snapshots `packageName`, `packageSlug`, `packageCollateral` into the ledger (Finalized Snapshot Pattern)

---

## Phase 3: Layout Shell

### Directory structure
```
src/app/
  layout.tsx                          # Update metadata to "Zippy v3"
  page.tsx                            # Redirect to /projects
  globals.css                         # Add shadcn/ui CSS variables
  (sa)/
    layout.tsx                        # SA shell: sidebar + module breadcrumbs + main area
    projects/
      page.tsx                        # Dashboard: project list
      new/page.tsx                    # New project form
      [projectId]/
        page.tsx                      # Project overview with module status
        packages/
          page.tsx                    # Package selection grid
          [packageSlug]/page.tsx      # Package detail + collateral + select action
```

### Layout components (`src/components/layout/`)

| Component | Type | Description |
|-----------|------|-------------|
| `app-sidebar.tsx` | Server | Fixed left sidebar with nav links |
| `module-breadcrumbs.tsx` | Client | Horizontal bar showing 4 module status pills, reads projectId from URL |
| `page-header.tsx` | Server | Reusable `<h1>` + description header |

---

## Phase 4: Project Dashboard & Creation

### Components (`src/components/projects/`)

| Component | Type | Description |
|-----------|------|-------------|
| `project-card.tsx` | Server | Card with customer name, status, package name, module dots |
| `project-form.tsx` | Client | Form: customer name + description, POST to API, redirect to packages |
| `module-status-badge.tsx` | Server | Semantic badge (green/amber/red/blue/zinc) |

### Pages
- **Dashboard** (`projects/page.tsx`): RSC fetches projects via Prisma, renders grid of `ProjectCard`, empty state with CTA
- **New Project** (`projects/new/page.tsx`): Renders `ProjectForm` client component

---

## Phase 5: Package Selection & Collateral

### Components (`src/components/packages/`)

| Component | Type | Description |
|-----------|------|-------------|
| `package-card.tsx` | Server | Card: name, category badge, description, service count |
| `package-grid.tsx` | Client | Groups by category, highlights selected, handles selection |
| `package-detail.tsx` | Client | Full detail view, services table, collateral list, "Select" button |
| `collateral-list.tsx` | Server | Renders collateral items with type icons and external links |
| `service-inclusion-badge.tsx` | Server | "Required" / "Standard" / "Optional" badges |

### Pages
- **Package browse** (`packages/page.tsx`): RSC fetches packages + project, passes to `PackageGrid`
- **Package detail** (`packages/[packageSlug]/page.tsx`): RSC fetches package by slug + project, renders `PackageDetail`

### Package selection flow
1. SA clicks "Select" on a package card or detail page
2. Client component PATCHes `/api/projects/[projectId]` with `selectedPackageId`, `packageName`, `packageSlug`, `packageCollateral` (snapshot)
3. API handler sets `moduleStates.ingestion = "completed"`, invalidates downstream
4. Client redirects back to project overview

### What Module 1 shows about Services
Module 1 displays the package's included Services at a high level (name, category, inclusion type). The Service Options and Design Options within each service are **not configured in Module 1** — that's Module 2's job. Module 1 just shows what services are bundled so the SA understands what they're selecting.

---

## Phase 6: Project Overview

**Page** (`projects/[projectId]/page.tsx`): RSC showing:
- 4 module status cards with semantic badges
- Selected package info (name, link to change)
- "Select Package" CTA if none selected

---

## Verification

1. **Seed data**: Run `npx prisma db seed` — verify 4 packages and 5 services in MongoDB
2. **API smoke test**: `curl http://localhost:3000/api/packages` returns seeded packages
3. **Full flow**: Create project → browse packages → view detail + collateral → select package → see project overview with "Ingestion: Completed" badge
4. **Invalidation**: Change package selection → downstream modules show "Out of Date"
5. **Empty state**: Dashboard with no projects shows empty state with CTA

---

## Files to Create/Modify (27 files)

**Modify (4):** `prisma/schema.prisma`, `package.json`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`
**Create — lib (4):** `prisma.ts`, `types.ts`, `utils.ts`, `constants.ts`
**Create — seed (1):** `prisma/seed.ts`
**Create — API (5):** taxonomy, packages (list + detail), projects (list+create, single+update)
**Create — layout components (3):** sidebar, breadcrumbs, page header
**Create — project components (3):** card, form, status badge
**Create — package components (5):** card, grid, detail, collateral list, inclusion badge
**Create — pages (6):** SA layout, dashboard, new project, project overview, package browse, package detail
