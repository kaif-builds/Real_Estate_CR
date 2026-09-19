# RealEstateCRM — Full Technical Specification

> **Purpose**: Complete reference for rebuilding this application on a different tech stack (Next.js + FastAPI + SQLAlchemy + PostgreSQL).  
> **Current Stack**: React 19 + Vite + TypeScript + Tailwind CSS v4 + Leaflet + Prisma (schema-only, not wired) + Mock data.  
> **Generated From**: Full source code audit of every file under `src/`, `prisma/`, and project config.

---

## Table of Contents

1. [Full Page Inventory](#1-full-page-inventory)
2. [Component Inventory](#2-component-inventory)
3. [Data Model](#3-data-model)
4. [Business Logic](#4-business-logic)
5. [Role-Based Access Control](#5-role-based-access-control)
6. [Auth / Session Handling](#6-auth--session-handling)
7. [Geolocation / Map Features](#7-geolocation--map-features)
8. [Sidebar / Navigation Structure](#8-sidebar--navigation-structure)
9. [Known Gaps / Incomplete Items](#9-known-gaps--incomplete-items)

---

## 1. Full Page Inventory

All routes are defined in [`src/App.tsx`](src/App.tsx#L44-L86).  
Every route except `/login` is wrapped in `RequireAuth` (L36–L42), which checks that `role !== null` via `useRole()`.  
The route `/agent/visit/:id` renders *outside* the `<Layout />` wrapper (full-screen mobile view).

### 1.1 Login (`/login`)

**File**: [`src/pages/Login.tsx`](src/pages/Login.tsx) (188 lines)  
**Route**: `/login` — always accessible, no auth guard.  
**Purpose**: Demo/mock authentication — user picks a role, enters dummy credentials, and is granted a session.

| Section | Details |
|---------|---------|
| **Role Selector** (L86–L106) | 2×2 grid of buttons for the 4 roles: `Super Admin`, `Office Executive`, `Agent`, `Client`. Selected role stored in local state `selectedRole`. |
| **Email Field** (L108–L125) | Pre-filled with `demo@propdesk.in`. Has `required` HTML attribute but the value is **never validated** against any backend. |
| **Password Field** (L127–L144) | Pre-filled with `password123`. Also **never validated**. |
| **Remember Me Checkbox** (L147–L157) | Rendered but **non-functional** — value is never read. |
| **Forgot Password Link** (L159–L163) | Rendered as `<a href="#">` — **placeholder, does nothing**. |
| **Log In Button** (L167–L181) | Calls `handleLogin` (L17–L53). If role is `Agent`, requests geolocation first; otherwise sets role immediately and navigates to `/`. |

**Login Flow** (L17–L53):
- If `selectedRole === "Agent"`:
  - Checks `navigator.geolocation` exists.
  - Calls `navigator.geolocation.getCurrentPosition()` with `enableHighAccuracy: true, timeout: 10000`.
  - On success: sets location data via `setLocation()`, starts continuous watching via `startWatching()`, sets role, navigates to `/`.
  - On failure: displays error "Location access is required for Agents to log in."
- For all other roles: sets `location` to `null`, sets role, navigates to `/`.

---

### 1.2 Dashboard (`/`)

**File**: [`src/pages/Dashboard.tsx`](src/pages/Dashboard.tsx) (25 lines)  
**Route**: `/` (index route inside `<Layout />`).  
**Purpose**: Role-based router — renders a different dashboard based on current role.

| Role | Component Rendered | File |
|------|-------------------|------|
| `Super Admin` | `OfficeExecutiveDashboard` | [`src/pages/dashboards/OfficeExecutiveDashboard.tsx`](src/pages/dashboards/OfficeExecutiveDashboard.tsx) |
| `Office Executive` | `OfficeExecutiveDashboard` | Same as above |
| `Agent` | `FieldAgentDashboard` | [`src/pages/dashboards/FieldAgentDashboard.tsx`](src/pages/dashboards/FieldAgentDashboard.tsx) |
| `Client` | `ClientPortal` | [`src/pages/ClientPortal.tsx`](src/pages/ClientPortal.tsx) |
| Default | `PlaceholderPage` | [`src/components/PlaceholderPage.tsx`](src/components/PlaceholderPage.tsx) |

---

### 1.2.1 Office Executive Dashboard

**File**: [`src/pages/dashboards/OfficeExecutiveDashboard.tsx`](src/pages/dashboards/OfficeExecutiveDashboard.tsx) (173 lines)  
**Roles**: Super Admin, Office Executive (via Dashboard.tsx switch L13–L16).

| Section | Details |
|---------|---------|
| **Summary Cards** (L56–L89) | 5 stat cards in a row: Active Leads (`42` hardcoded), Active Requirements (computed: `mockRequirements.filter(r => r.status === 'Active').length`), Active Inventory (computed: properties with status `Available` or `Active`), Pending Follow-ups (computed: `mockFollowUps.filter(f => f.status === 'PENDING').length`), Overdue Follow-ups (`3` hardcoded). Amber/red highlight when value > 0. |
| **Today's Follow-up Queue** (L94–L130) | Table: Client, Type, Purpose, Priority (badge), Action. Data from `mockFollowUps`. Action column has a ✓ "Mark Done" button — **placeholder/no-op**. |
| **Stale Records Alert** (L132–L167) | Table: Type, Name, Last Activity, Status. Data from `getStaleProperties()`. Amber left border accent. |

---

### 1.2.2 Field Agent Dashboard

**File**: [`src/pages/dashboards/FieldAgentDashboard.tsx`](src/pages/dashboards/FieldAgentDashboard.tsx) (118 lines)  
**Roles**: Agent only (via Dashboard.tsx switch L17–L18).

| Section | Details |
|---------|---------|
| **Location Error Banner** (L13–L23) | Red banner if `locationError` is non-null showing the error message. |
| **Summary Cards** (L32–L54) | 3 cards: Today's Visits (`3` hardcoded), Completed This Week (`12` hardcoded), Pending Reports (`1` hardcoded, amber). |
| **Live Location Map** (L57–L114) | Full `<LiveMap>` component with agent's real GPS coordinates, accuracy display, reverse-geocoded address, "Live" pulsing indicator. Shows "Acquiring Location..." placeholder while waiting for GPS. |

---

### 1.2.3 Client Portal (Dashboard for Client role)

**File**: [`src/pages/ClientPortal.tsx`](src/pages/ClientPortal.tsx) (approximately 320 lines)  
**Not routed directly** — rendered by `Dashboard.tsx` when `role === "Client"`.

| Section | Details |
|---------|---------|
| **Welcome Header** | Greeting for the hardcoded client (Amit Jain, `clientId = 'p4'`). |
| **My Requirement** | Displays first active requirement for the client. Shows category, preferred locations, budget range, and a "Dedicated Consultant" card for hardcoded "Aman Desai". **"Contact Aman" button: placeholder/no-op.** |
| **Properties Shared With You** | Grid of property cards derived from `mockMatches` filtered by client's requirement where `status === 'SHARED'`. Each card has: image (Unsplash placeholder), price, category, shortLoc. Reaction buttons (Liked/Neutral/Pass) — **functional in local state only** (sets `reactions` state). Comment input revealed on reaction. **"Request a Visit" button: sets `visitRequested` in local state, shows alert.** |
| **My Visit History** | Timeline of visits from `mockVisits` matching the client's requirements. Shows completed/upcoming visits with outcome data from `outcomeJson`. |

**Business Logic**:
- `formatMoney` (inline): `>= 10000000` → `₹X.XX Cr`, `>= 100000` → `₹X.X L`, else `₹N`.

---

### 1.3 Leads (`/leads`)

**File**: [`src/pages/Leads.tsx`](src/pages/Leads.tsx) (approximately 440 lines)  
**Purpose**: Track and manage sales leads from various sources.

| Section | Details |
|---------|---------|
| **Header** | Title, description, "New Lead" button. |
| **Filters** | Search (by name/ID), Status dropdown (All, New, Contacted, Qualified, Lost), Priority dropdown (All, Critical, High, Medium, Low), Source dropdown (All, Website, Referral, Walk-in, Cold Call). |
| **Table Columns** | Lead ID, Party (name from `mockParties`), Type, Source, Status (badge), Priority (badge), Value (₹), Assigned To, Last Activity, Next Follow-Up, Actions. |
| **Actions Column** | "View" button — **placeholder/no-op**. |
| **New Lead Form** | Fields: Party (dropdown from `mockParties`), Lead Type, Source, Priority, Assigned To, Value, Remarks. Cancel button returns to list. **"Create Lead" button: placeholder/no-op.** |

**Business Logic**: Enriches `mockLeads` by joining `partyId` → `mockParties` for name, and `assignedToId` → `mockUsers` for assignee name.

---

### 1.4 Parties (`/parties`)

**File**: [`src/pages/Parties.tsx`](src/pages/Parties.tsx) (approximately 470 lines)  
**Purpose**: Central contact directory for all individuals/entities (owners, buyers, brokers, etc.).

| Section | Details |
|---------|---------|
| **Header** | Title, description, "New Party" button. |
| **Filters** | Search (by name/phone/email), City dropdown, Role dropdown. |
| **Table Columns** | Name, Email, Phone, City, Roles (multi-badge), Actions. |
| **Actions Column** | "View" and "Edit" buttons — **both placeholder/no-op**. |
| **New Party Form** | Fields: Full Name, Email, Phone, City, Roles (multi-select checkboxes for all Party role values), Remarks. Cancel returns to list. **"Save Party" button: placeholder/no-op.** |

---

### 1.5 Properties / Inventory (`/inventory`)

**File**: [`src/pages/Inventory.tsx`](src/pages/Inventory.tsx) (approximately 550 lines)  
**Purpose**: Manage property listings with location, category, pricing, and verification status.

| Section | Details |
|---------|---------|
| **Header** | Title, description, "Add Property" button. |
| **Filters** | Search (by ID/ShortLoc), Category dropdown, Status dropdown. |
| **Table Columns** | Property ID, ShortLoc, Category (badge), Price (formatted), Status (badge with color coding), Owner (from `mockParties`), Last Verified, Actions. |
| **Price Formatting** | Rental → `₹N/mo`, `>= 1Cr` → `₹X.XX Cr`, `>= 1L` → `₹X.X L`. |
| **Status Badge Colors** | Available → green, Active → blue, Under Negotiation → amber, Sold → slate/strikethrough. |
| **Actions Column** | "View" and "Edit" buttons — **both placeholder/no-op**. |
| **New Property Form** | Fields: Category, ShortLoc, Address, Price, Status, Owner (dropdown from parties), Details JSON textarea. Cancel returns to list. **"Save Property" button: placeholder/no-op.** |

---

### 1.6 Requirements (`/requirements`)

**File**: [`src/pages/Requirements.tsx`](src/pages/Requirements.tsx) (approximately 490 lines)  
**Purpose**: Track buyer/tenant property requirements with budget ranges and location preferences.

| Section | Details |
|---------|---------|
| **Header** | Title, description, "New Requirement" button. |
| **Filters** | Search (by ID/client), Category dropdown, Status dropdown. |
| **Table Columns** | Req ID, Client (from `mockParties`), Category (badge), Intent (RENT/BUY badge), Budget Range (formatted), Preferred Locations (tag list), Status, Match Count (computed from `mockMatches`), Actions. |
| **Match Count** | Computed by filtering `mockMatches.filter(m => m.requirementId === req.id).length`. |
| **Budget Formatting** | `formatBudget(min, max)`: `>= 100000` → `₹X.XL`, `< 100000` → `₹Xk`. |
| **Actions** | "View" and "Edit" buttons — **placeholder/no-op**. |
| **New Requirement Form** | Fields: Client (dropdown), Category, Intent, Min Budget, Max Budget, Preferred ShortLocs (tag input), Status, Remarks. Cancel returns to list. **"Save Requirement" button: placeholder/no-op.** Form tag close (X) buttons — **placeholder/no-op (do not remove tags)**. |

---

### 1.7 Matching Workspace (`/matching`)

**File**: [`src/pages/MatchingWorkspace.tsx`](src/pages/MatchingWorkspace.tsx) (281 lines)  
**Purpose**: Select a requirement and view/compute ranked property matches with score breakdown.

| Section | Details |
|---------|---------|
| **Left Panel: Requirements List** (L86–L141) | Search by ID or client name. Category filter dropdown. List of requirement cards showing ID, intent badge, client name, category. Click to select. |
| **Right Panel: Match Results** (L144–L277) | Header shows selected client name, category, preferred locations, budget range. "Run Matching" button (L155–L166). Match result cards. Empty state with "Select a Requirement" prompt. |
| **Match Card** | Shows: Property ID, category badge, ShortLoc, Price (formatted), Score % (large number), Tier badge (color-coded). |
| **"Why this match?" Section** (L206–L241) | Expandable accordion per card. Lists `scoreBreakdown` entries as checklist items. `PASS` → green ✓ icon. `WARNING(...)` → amber ⚠ icon. |
| **Action Buttons per Card** (L243–L257) | Shortlist, Reject Match, Share, Schedule Visit — **all placeholder/no-op**. |
| **"Run Matching" Button** (L62–L71) | Simulates a 1.5-second computation delay (`setTimeout`). Does not actually recompute scores — just shows existing `mockMatches` filtered by `selectedReqId` and auto-expands cards. |

**Business Logic — Score/Tier Display**:
- **TierBadge** (L7–L23): `score >= 90` → emerald (HIGH), `score >= 75` → blue (GOOD), `score >= 60` → amber (POSSIBLE).
- **formatPrice** (L25–L30): If category includes "Rental" → `₹N/mo`, else standard Cr/L formatting.
- **Score breakdown** stored in `mockMatches[].scoreBreakdown` as `{ criteria: "PASS" | "WARNING (...)" }`.

---

### 1.8 Matches (`/matches`)

**File**: [`src/pages/Matches.tsx`](src/pages/Matches.tsx) (approximately 250 lines)  
**Purpose**: Flat table view of all matches with filtering and status management.

| Section | Details |
|---------|---------|
| **Filters** | Search, Tier dropdown (All/HIGH/GOOD/POSSIBLE), Status dropdown (All/SUGGESTED/SHARED/VISIT_SCHEDULED/SHORTLISTED/REJECTED). |
| **Table Columns** | Match ID, Requirement (linked to client name), Property (ShortLoc), Score (% with color), Tier (badge), Status (badge), Actions. |
| **Actions** | "Approve", "Reject" — **placeholder/no-op**. |

---

### 1.9 Visits (`/visits`)

**File**: [`src/pages/Visits.tsx`](src/pages/Visits.tsx) (approximately 420 lines)  
**Purpose**: Schedule, assign, and track property site visits.

| Section | Details |
|---------|---------|
| **Header** | Title, description, "Schedule Visit" button. |
| **Filters** | Search, Status dropdown, Agent dropdown. |
| **Table Columns** | Visit ID, Property (ShortLoc from `mockProperties`), Requirement ID, Agent (name from `mockUsers`), Status (color-coded badge), Purpose, Planned Date (formatted), Actions. |
| **Status Badge Colors** | ASSIGNED → blue, SCHEDULED → indigo, COMPLETED → green, SUBMITTED → purple, EN_ROUTE → amber. |
| **Actions** | "View Report" (for COMPLETED/SUBMITTED) navigates to `/visits/:id/review`. "Start Visit" (for ASSIGNED/SCHEDULED) navigates to `/agent/visit/:id`. Others — **placeholder/no-op**. |
| **Schedule Visit Form** | Fields: Property (dropdown), Requirement (dropdown), Agent (dropdown), Purpose, Planned Date. Cancel returns to list. **"Create Visit" button: placeholder/no-op.** |

---

### 1.10 Agent Visit Execution (`/agent/visit/:id`)

**File**: [`src/pages/AgentVisitExecution.tsx`](src/pages/AgentVisitExecution.tsx) (516 lines)  
**Route**: `/agent/visit/:id` — rendered **outside Layout** (full-screen mobile experience).  
**Purpose**: Multi-step wizard for field agents to execute and report a site visit.

**7 Steps** (L12): Details → Navigate → Arrival → Checklist → Photos → Outcome → Submit.

| Step | Section | Details |
|------|---------|---------|
| 0: **Details** (L130–L182) | Property info card (hardcoded: "01-Schm140_Mayank"), client contact card ("Vikram Singh, +91 98765 43210"), address card, special instructions card, live distance readout from GPS. |
| 1: **Navigate** (L184–L225) | "Start Navigation" button (**placeholder/no-op**). Live `<LiveMap>` with agent marker + target property marker (hardcoded coords `22.7196, 75.8577`). Distance readout. |
| 2: **Arrival** (L227–L291) | Large circular "Confirm Arrival" button. Live distance indicator (green if < 200m, amber if farther). After confirming: shows "Arrival Confirmed" with GPS distance. Also shows a demo "GPS Unavailable or Mismatch" failure state example. |
| 3: **Checklist** (L293–L328) | 5 checkbox items: "Property matches listing details" (pre-checked), "Photographs of front elevation taken" (pre-checked), "Owner/tenant present" (N/A, struck through), "Client signed visit register", "Verified parking space". |
| 4: **Photos** (L330–L365) | 2×2 grid: 2 Unsplash placeholder photos ("Property Front", "Interior/Hall"), 1 empty "Road/Access (Pending)" slot, "Add Photo" button (**placeholder/no-op — no camera integration**). |
| 5: **Outcome** (L367–L428) | Form: Person Met (text, default "Vikram Singh"), Customer Interest (radio: Highly Interested/Neutral/Not Interested), Property Condition (select: Good/Fair/Poor), Recommended Next Action (select), Remarks (textarea with default text). |
| 6: **Submit** (L430–L466) | "Ready to Submit?" prompt with "Submit Visit Report" button → sets `submitted = true` → shows success animation → auto-navigates to `/` after 2 seconds. "Review Entries Again" returns to step 0. |

**Bottom Navigation Bar** (L472–L512): Back/Next buttons with step dot indicators. Hidden after submission.

**Business Logic — Distance Calculation** (L21–L33):
- `haversineDistance(lat1, lng1, lat2, lng2)`: Haversine formula returning distance in meters.
- `EXPECTED_COORDS = { lat: 22.7196, lng: 75.8577 }` (hardcoded Scheme 140, Indore).
- `distanceInfo.isClose = dist < 200` — within 200 meters is considered "at location".
- `formatDistance(meters)`: `< 1000` → `Nm`, else `N.Xkm`.

---

### 1.11 Visit Review (`/visits/:id/review`)

**File**: [`src/pages/VisitReview.tsx`](src/pages/VisitReview.tsx) (approximately 260 lines)  
**Purpose**: Manager review of a submitted visit report — approve or reject with notes.

| Section | Details |
|---------|---------|
| **Visit Details** | Property ShortLoc, Agent name, Planned Date, Status badge. |
| **Checklist Results** | Renders `checklistJson` keys as labeled items with ✓/✗ icons. |
| **Photos** | Renders `photosJson` array as an image gallery. |
| **Outcome** | Renders `outcomeJson` fields: interest level, client remarks. |
| **Review Actions** | "Approve" and "Reject" buttons with a remarks textarea. **Both placeholder/no-op** — they do not actually update the visit status. |

---

### 1.12 Opportunities Pipeline (`/opportunities`)

**File**: [`src/pages/Opportunities.tsx`](src/pages/Opportunities.tsx) (358 lines)  
**Purpose**: Kanban board for deal pipeline management.

**Kanban Columns** (L9–L17): `Qualified`, `Property Shared`, `Site Visit`, `Negotiation`, `Documentation`, `Won`, `Lost`.

| Section | Details |
|---------|---------|
| **Header** | Title, "New Opportunity" button — **placeholder/no-op**. |
| **Kanban Cards** (L82–L144) | Each card shows: Opp ID, ShortLoc, Client Name, Expected Value (formatted), Agent initials (avatar circle), Probability bar (only for non-terminal stages). Won cards have emerald left border. Lost cards are dimmed. |
| **Detail Slide-over** (L152–L353) | Opens on card click. Shows: Core Info (Property, Client, Value, Agent), Transaction Details (only if Won — shows final value, commission amount and %), Negotiation History timeline (rendered if `history` property exists — **it doesn't exist in mock data, so always shows "No negotiation rounds recorded"**). |
| **Closure Actions** (L317–L351) | "Close as Won" → reveals transaction form (Final Value, Commission %, Agent, Payment Status). "Close as Lost" → reveals lost reason form (Lost Reason dropdown, Remarks textarea). "Confirm & Save" button — **placeholder/no-op**. Only visible for non-terminal stages. |

---

### 1.13 Transactions (`/transactions`)

**File**: [`src/pages/Transactions.tsx`](src/pages/Transactions.tsx) (approximately 250 lines)  
**Purpose**: Record of closed deals and commission tracking.

| Section | Details |
|---------|---------|
| **Header** | Title, description. |
| **Filters** | Type dropdown (All/SALE/RENT), Status dropdown (All/RECEIVED/PENDING/PARTIAL). |
| **Table Columns** | Transaction ID, Opportunity ID, Property ID (ShortLoc), Type (SALE/RENT badge), Value (₹ formatted), Commission Amount, Commission %, Payment Status (badge), Closed Date. |
| **Status Badge Colors** | RECEIVED → green, PENDING → amber, PARTIAL → blue. |
| **Actions** | "View" button — **placeholder/no-op**. |

---

### 1.14 Commissions (`/commissions`)

**File**: [`src/pages/Commissions.tsx`](src/pages/Commissions.tsx) (206 lines)  
**Purpose**: Staff commission overview derived from transactions.  
**Access**: **Super Admin only** — explicit check at L11–L17.

| Section | Details |
|---------|---------|
| **Header** | Title, description. |
| **Main Table Columns** | (expand chevron), Staff Member (name + role), Total Deals, Total Earned (₹), Paid (₹), Pending (₹), Trend (MoM). |
| **Expanded Row** | Nested table with Transaction ID, Type, Deal Value, Commission, Status (badge), Date. |

**Business Logic — Commission Aggregation** (L30–L77): See [Section 4.3](#43-commission-aggregation-logic).

---

### 1.15 Follow-Ups (`/follow-ups`)

**File**: [`src/pages/FollowUps.tsx`](src/pages/FollowUps.tsx) (approximately 590 lines)  
**Purpose**: Track scheduled follow-up activities across leads, requirements, and opportunities.

| Section | Details |
|---------|---------|
| **Access Control** | Client: blocked entirely (L187–L193). Agent: sees only assigned follow-ups (L161–L163), cannot see Responsible filter (L411), cannot see "New Follow-up" button (L348). Super Admin / OE: full access. |
| **Filters** | Search (client/purpose/ID), Status, Priority, Responsible (hidden for Agent). |
| **Summary Bar** | Counts of Pending, Overdue, Completed. |
| **Table Columns** | ID, Client/Party, Type, Purpose, Priority (badge), Due Date, Status (badge), Responsible, Actions. |
| **Actions** | "Mark Done" and "Reschedule" — **placeholder/no-op**. Hidden if COMPLETED or CANCELLED. |
| **New Follow-up Form** | Fields: Linked Record, Date & Time, Purpose, Priority, Responsible, Expected Outcome. **"Create Follow-up" button: placeholder/no-op.** |

**Business Logic — Status Derivation** (L51–L59): If status is `PENDING` and date is in the past, automatically converts to `OVERDUE`.

---

### 1.16 Tasks (`/tasks`)

**File**: [`src/pages/Tasks.tsx`](src/pages/Tasks.tsx) (approximately 440 lines)  
**Purpose**: Manage internal operational tasks (verifications, documentation, admin).

| Section | Details |
|---------|---------|
| **Access Control** | SA/OE see all tasks. Agent and Client see only tasks assigned to them (L55–L59 via `getRoleUserId`). |
| **View Modes** | List View and Board View (Kanban) toggle. |
| **List View Table** | Task (title, type, linked record), Assignment, Status & Priority, Due Date, Actions. "Edit" button — **placeholder/no-op**. |
| **Board View** | 3 columns: "To Do", "In Progress" (combines In Progress + Overdue), "Done". Cards show: priority badge, type, title, description, linked record, assignee, date. |
| **New Task Modal** | Fields: Title, Type, Assigned To (excludes Client role), Priority, Due Date, Linked Record, Description. "Create Task" — **closes modal, no-op persistence**. |

---

### 1.17 Telecalling (`/telecalling`)

**File**: [`src/pages/Telecalling.tsx`](src/pages/Telecalling.tsx) (approximately 380 lines)  
**Purpose**: Log and review call activities.

| Section | Details |
|---------|---------|
| **Filters** | Outcome dropdown, Caller dropdown (staff only), Date dropdown (All Time / Today). |
| **Table Columns** | Party/Lead, Call Details (type, duration), Outcome (badge), Caller & Time, Remarks. |
| **Outcome Badge Colors** | Connected → green, No Answer → amber, Call Back Later → blue, Missed → red, Busy → slate, Wrong Number → red. |
| **Log Call Modal** | Fields: Party/Lead, Call Type (Outbound/Inbound/Missed), Outcome, Duration (minutes), Remarks, "Schedule a Follow-up" checkbox → reveals Date & Purpose fields. **"Save Log" button: placeholder/no-op.** |

**Business Logic**: "Today" date filter matches current year, month, and day (L53–L57).

---

### 1.18 Timeline (`/timeline`)

**File**: [`src/pages/Timeline.tsx`](src/pages/Timeline.tsx) (approximately 230 lines)  
**Purpose**: Chronological feed of all system activities.

| Section | Details |
|---------|---------|
| **Filters** | Activity Type dropdown, Assigned To dropdown, Date Range dropdown (All Time / Last 7 Days). |
| **Timeline Feed** | Chronological list with: icon (per activity type), type badge, party name, date/time, notes, createdBy name, linked entity IDs. Sorted descending by timestamp. |

**Business Logic**: "Last 7 Days" filter: `Date.now() - createdAt < 7 * 86400000`.

---

### 1.19 Alerts (`/alerts`)

**File**: [`src/pages/Alerts.tsx`](src/pages/Alerts.tsx) (approximately 170 lines)  
**Purpose**: Configure alert thresholds and enable/disable automated system insights.  
**Access**: **Super Admin only** (L19–L25).

| Section | Details |
|---------|---------|
| **Alert Items** | 5 configurable alerts: Stale Lead (threshold in days), Unverified Inventory (days), Stalled Opportunity (days), Overdue Follow-up (days), Visit Not Scheduled (days). Each has: icon, name, description, threshold number input, enable/disable toggle switch. |
| **"Save Changes" Button** | Shows a success toast for 3 seconds — **no actual persistence**. |

---

### 1.20 Field Staff (`/field-staff`)

**File**: [`src/pages/FieldStaff.tsx`](src/pages/FieldStaff.tsx) (approximately 310 lines)  
**Purpose**: Manage agent availability, locations, and schedules.

| Section | Details |
|---------|---------|
| **Table Columns** | Agent Name & Contact (from `mockUsers`), Current Status (badge: On Visit/Available/Off Duty), Visit Performance (Today, This Week, Rating), Location, Actions. |
| **Actions** | "View Schedule" — opens slide-over panel. |
| **Slide-over** | Timeline of visits for the selected agent from `mockVisits`. Shows date, time, status badge, purpose, property ShortLoc, requirement ID. Visits sorted chronologically. |

---

### 1.21 Demand-Supply Analysis (`/demand-supply`)

**File**: [`src/pages/DemandSupply.tsx`](src/pages/DemandSupply.tsx) (approximately 310 lines)  
**Purpose**: Analyze market gaps and inventory coverage.

| Section | Details |
|---------|---------|
| **Filters** | Category dropdown, Location text search. |
| **By Category Table** | Category, Demand (active requirement count), Supply (available/active property count), Gap (Demand − Supply). Color-coded: positive gap = red (under-supply), negative = green (over-supply). |
| **Top 10 Micro-Locations Table** | ShortLoc, Demand, Supply, Gap. Sorted by total volume (demand + supply) descending, limited to top 10. |
| **Aging Inventory Section** | Lists properties unverified for 5+ days via `getStaleProperties()`. Columns: ID, ShortLoc, Last Verified, Age (days), Status. |

---

### 1.22 Reports (`/reports`)

**File**: [`src/pages/Reports.tsx`](src/pages/Reports.tsx) (approximately 340 lines)  
**Purpose**: MIS dashboard with metrics, demand-supply overview, and staff performance.

| Section | Details |
|---------|---------|
| **Section A: Demand vs Supply** | Table with Category, Demand, Supply, Gap. Progress bars with width = `(value / absoluteMax) * 100%` where `absoluteMax` = max of all demand/supply values. |
| **Section B: Ageing / Stale Records** | 4 stat cards: Stale Leads (count), Unverified Inventory (count), Requirements Without Match (count), Stalled Opportunities (count). "View List" buttons — **placeholder/no-op**. Combined table: Type, Name/ID, Days Since Activity, Assigned To. |
| **Section C: Staff Performance** | Table: Staff Name, Role, Calls/Visits, Follow-ups, Opportunities Won, Conversion %. **Data is largely hardcoded/static in the template.** |

---

### 1.23 Audit Log (`/audit`)

**File**: [`src/pages/Audit.tsx`](src/pages/Audit.tsx) (approximately 220 lines)  
**Purpose**: Read-only historical record of system-wide changes.  
**Access**: **Super Admin only** (L23–L29).

| Section | Details |
|---------|---------|
| **Filters** | Entity type dropdown, User dropdown, Date Range dropdown (All Time / Last 7 Days). |
| **Table Columns** | Timestamp, User (name from `mockUsers`), Action (color-coded badge), Entity (type + ID), Summary, Details (chevron — **placeholder/no-op**). |
| **Action Badge Colors** | Created → green, Updated → blue, Deleted → red, Status Changed → amber. |

---

### 1.24 User Management (`/user-management`)

**File**: [`src/pages/UserManagement.tsx`](src/pages/UserManagement.tsx) (approximately 290 lines)  
**Purpose**: Manage system user accounts and role assignments.

| Section | Details |
|---------|---------|
| **Table Columns** | User Details (name, email, avatar), Role (color-coded badge), Status (toggle switch — **no-op**), Last Login, Actions (Edit/Settings — **no-op**). |
| **Role Badge Colors** | SUPER_ADMIN → purple, OFFICE_EXECUTIVE → blue, AGENT → green, CLIENT → slate. |
| **Add User Form** | Fields: Full Name, Email, System Role (dropdown), "Account is Active" checkbox. **"Create User" button: placeholder/no-op.** |

---

### 1.25 Settings / Master Data (`/settings`)

**File**: [`src/pages/Settings.tsx`](src/pages/Settings.tsx) (approximately 380 lines)  
**Purpose**: Manage global system parameters and lookup lists.

| Tab | Content |
|-----|---------|
| **Categories** | Editable list of property categories with toggle switches. "Add New" button. |
| **Lead Sources** | Editable list of lead sources. |
| **Follow-up & Tasks** | Lists of task types and follow-up priorities. |
| **Matching Weights** | Range sliders for: Location (default 40), Budget (default 30), Type (default 20), Availability (default 10). Total must equal 100 — red warning if not. |
| **Visit Checklists** | Accordion sections for Residential / Commercial / Plot checklists with items. "Add Item" buttons. |
| **System Thresholds** | Number inputs: Geo-fence radius (meters), Staleness threshold (days), Verification frequency (days). |
| **Save Changes** | Triggers `alert()` — **no actual persistence**. |

**Business Logic**: Total matching weight validation (L195–L206): If `totalWeight !== 100`, shows a red warning and the summary box border turns red.

---

## 2. Component Inventory

### 2.1 `Layout`

**File**: [`src/components/Layout.tsx`](src/components/Layout.tsx) (74 lines)  
**Props**: None (renders `<Outlet />`).  
**Used by**: `App.tsx` as the wrapper route element (L55).

| Condition | Rendering |
|-----------|-----------|
| `role === "Client"` (L17) | Custom top header with "RealEstateCRM \| My Portal" branding, hardcoded profile "Vikram Singh (Client)", sign-out dropdown. **No sidebar.** Content rendered via `<Outlet />`. |
| All other roles (L60) | `<Sidebar />` on left + `<Header />` on top + `<Outlet />` in main content area, wrapped in `max-w-7xl` container. |

---

### 2.2 `Sidebar`

**File**: [`src/components/Sidebar.tsx`](src/components/Sidebar.tsx) (267 lines)  
**Props**: None.  
**Used by**: `Layout.tsx` (L62) for non-Client roles.

See [Section 8: Sidebar / Navigation Structure](#8-sidebar--navigation-structure) for full detail.

---

### 2.3 `Header`

**File**: [`src/components/Header.tsx`](src/components/Header.tsx) (64 lines)  
**Props**: None.  
**Used by**: `Layout.tsx` (L64) for non-Client roles.

| Element | Details |
|---------|---------|
| **Search Bar** (L18–L27) | Text input, hidden on mobile (`hidden md:block`). **Placeholder — no search functionality implemented.** |
| **Notification Bell** (L31–L33) | Bell icon button. **Placeholder/no-op.** |
| **User Dropdown** (L37–L58) | Shows "Demo User" + current role. Hover reveals dropdown with profile info and "Sign out" button (calls `setRole(null)` + `navigate('/login')`). |

---

### 2.4 `LiveMap`

**File**: [`src/components/LiveMap.tsx`](src/components/LiveMap.tsx) (153 lines)  
**Props** (L20–L30):

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `lat` | `number` | ✅ | — | Agent latitude |
| `lng` | `number` | ✅ | — | Agent longitude |
| `accuracy` | `number` | ❌ | — | GPS accuracy radius in meters |
| `targetLat` | `number` | ❌ | — | Target (property) latitude |
| `targetLng` | `number` | ❌ | — | Target (property) longitude |
| `className` | `string` | ❌ | `"h-[300px]"` | CSS height class |
| `zoom` | `number` | ❌ | `16` | Initial zoom level |

**Used by**: `FieldAgentDashboard.tsx` (L88–L93), `AgentVisitExecution.tsx` (L199–L206).

**Rendering**:
- Initializes Leaflet map with OpenStreetMap tiles (L64–L68).
- Blue marker at agent position with "Your location" popup (L71–L72).
- Translucent blue accuracy circle (L77–L84): color `#3b82f6`, fill opacity `0.12`.
- If `targetLat`/`targetLng` provided: second marker tinted red via CSS `hue-rotate-[140deg] saturate-150` (L97), "Property location" popup. Map auto-fits bounds to show both markers with 30% padding.
- Update effect (L123–L143): smooth `panTo` on coordinate changes, no re-mount.

---

### 2.5 `PlaceholderPage`

**File**: [`src/components/PlaceholderPage.tsx`](src/components/PlaceholderPage.tsx) (46 lines)  
**Props**: None.  
**Used by**: `App.tsx` wildcard route `*` (L79), `Dashboard.tsx` default case (L22).

Displays a "Coming Soon" message with the page title auto-derived from either `ROLE_NAV_ITEMS` lookup (L11–L12) or URL path auto-capitalization (L18–L20).

---

## 3. Data Model

### 3.1 Prisma Schema (Reference Schema)

**File**: [`prisma/schema.prisma`](prisma/schema.prisma) (384 lines)  
**Database**: PostgreSQL (`datasource db`, L5–L8).

> **Important**: The Prisma schema defines the target relational model but is **not currently wired** to the frontend. The app uses hardcoded mock data arrays in [`src/lib/mockData.ts`](src/lib/mockData.ts).

### 3.2 Enums

| Enum | Values | File Reference |
|------|--------|----------------|
| `Role` (Party Role) | `OWNER`, `BROKER`, `BUILDER`, `CLIENT`, `SELLER`, `TENANT`, `LANDLORD`, `CONSULTANT` | `schema.prisma` L10–L19 |
| `LeadType` | `BUYER`, `SELLER`, `OWNER`, `TENANT`, `LANDLORD`, `INVESTOR`, `CONSULTANT`, `OTHER` | L21–L30 |
| `PropertyCategory` | `RENTAL_RESIDENTIAL`, `RENTAL_COMMERCIAL`, `BUY_SELL_FLAT`, `BUY_SELL_COMMERCIAL`, `PLOT` | L32–L38 |
| `PropertyStatus` | `NEW`, `UNDER_VERIFICATION`, `AVAILABLE`, `ACTIVE`, `ON_HOLD`, `RESERVED`, `UNDER_NEGOTIATION`, `SOLD`, `RENTED`, `LEASED`, `WITHDRAWN`, `INACTIVE` | L40–L53 |
| `Intent` | `BUY`, `RENT`, `LEASE` | L55–L59 |
| `RequirementStatus` | `NEW`, `ACTIVE`, `QUALIFIED`, `LOW_CLARITY`, `FULFILLED`, `DROPPED` | L61–L68 |
| `MatchTier` | `HIGH`, `GOOD`, `POSSIBLE` | L70–L74 |
| `MatchStatus` | `SUGGESTED`, `SHARED`, `VISIT_SCHEDULED`, `REJECTED`, `SHORTLISTED` | L76–L82 |
| `ActivityType` | `CALL`, `FOLLOWUP`, `WHATSAPP`, `EMAIL`, `MEETING`, `PROPERTY_SHARE`, `VISIT`, `TASK`, `OTHER` | L84–L94 |
| `FollowUpStatus` | `PENDING`, `COMPLETED`, `RESCHEDULED`, `CANCELLED`, `OVERDUE`, `NO_RESPONSE` | L96–L103 |
| `VisitStatus` | `ASSIGNED`, `ACCEPTED`, `SCHEDULED`, `EN_ROUTE`, `ARRIVED`, `STARTED`, `COMPLETED`, `SUBMITTED`, `APPROVED`, `REJECTED`, `CANCELLED` | L105–L117 |
| `GpsValidation` | `VALID`, `PARTIAL`, `INVALID`, `UNAVAILABLE` | L119–L124 |
| `OpportunityStage` | `QUALIFIED`, `PROPERTY_SHARED`, `SITE_VISIT`, `NEGOTIATION`, `DOCUMENTATION`, `WON`, `LOST` | L126–L134 |
| `UserRole` | `SUPER_ADMIN`, `OFFICE_EXECUTIVE`, `AGENT`, `CLIENT` | L136–L141 |
| `Role` (Frontend) | `"Super Admin" \| "Office Executive" \| "Agent" \| "Client"` | `src/types.ts` L30 |

> **Note**: The frontend `Role` type uses space-separated display names while Prisma's `UserRole` uses `SCREAMING_SNAKE_CASE`. The mock data uses both conventions inconsistently.

### 3.3 Entity Definitions

#### Party
**Prisma**: `schema.prisma` L143–L166. **Mock**: `mockData.ts` L13–L22 (8 records).

| Field | Prisma Type | Mock Field | Mock Type | Notes |
|-------|------------|------------|-----------|-------|
| `id` | `String @id @default(cuid())` | `id` | `string` | E.g. `'p1'`..`'p8'` |
| `name` | `String` | `name` | `string` | E.g. "Ramesh Patel", "Amit Jain" |
| `mobile` | `String` | `phone` | `string` | E.g. "+91 9876543210" |
| `altMobile` | `String?` | — | — | Not in mock |
| `email` | `String?` | `email` | `string` | |
| `address` | `String?` | — | — | Not in mock |
| `city` | `String?` | `city` | `string` | Values: "Indore", "Bhopal", "Pune", "Ujjain" |
| `role` | `Role` (enum) | `roles` | `string[]` | Mock uses array of roles per party |
| `source` | `String?` | — | — | Not in mock |
| `status` | `String?` | — | — | Not in mock |
| `tags` | `String[]` | — | — | Not in mock |
| `remarks` | `String?` | — | — | Not in mock |

**Mock Examples**:
- `{ id: 'p1', name: 'Ramesh Patel', city: 'Indore', roles: ['OWNER', 'SELLER'] }`
- `{ id: 'p4', name: 'Amit Jain', city: 'Indore', roles: ['BUYER', 'CLIENT'] }`
- `{ id: 'p7', name: 'Deepak Broker', city: 'Ujjain', roles: ['BROKER'] }`

**Relationships**: Owns Properties, has Leads, has Requirements, is Buyer/Seller on Opportunities.

---

#### Lead
**Prisma**: L168–L183. **Mock**: `mockData.ts` L125–L130 (4 records).

| Field | Prisma Type | Mock Field | Mock Type |
|-------|------------|------------|-----------|
| `id` | `String @id` | `id` | `string` | E.g. `'L-1001'` |
| `partyId` | `String` (FK → Party) | `partyId` | `string` |
| `leadType` | `LeadType` | `type` | `string` | Values used: "Buyer", "Tenant", "Investor", "Landlord" |
| `source` | `String?` | `source` | `string` | Values: "Website", "Referral", "Walk-in", "Cold Call" |
| `priority` | `String?` | `priority` | `string` | Values: "Critical", "High", "Medium", "Low" |
| `assignedToId` | `String` (FK → User) | `assignedToId` | `string` |
| `status` | `String?` | `status` | `string` | Values: "New", "Contacted", "Qualified", "Lost" |
| `remarks` | `String?` | `remarks` | `string` |
| — | — | `value` | `number \| null` | E.g. `7500000`, `25000`, `20000000`, `null` |
| — | — | `lastActivity` | `string` | E.g. "2 hours ago", "1 day ago", "3 days ago" |
| — | — | `nextFollowUp` | `string` | E.g. "Tomorrow", "Next Week", "-" |

---

#### Property
**Prisma**: L185–L210. **Mock**: `mockData.ts` L24–L35 (10 records).

| Field | Prisma Type | Mock Field | Mock Type |
|-------|------------|------------|-----------|
| `id` | `String @id` | `id` | `string` | E.g. `"P-1001"` |
| `category` | `PropertyCategory` | `category` | `string` | Values: "Rental Residential", "Rental Commercial", "Buy-Sell Flat", "Buy-Sell Commercial", "Plot" |
| `shortLoc` | `String` (indexed) | `shortLoc` | `string` | See values below |
| `price` | `Float` | `price` | `number` | Range: 15000 – 22000000 |
| `status` | `PropertyStatus` | `status` | `string` | Values used: "Available", "Active", "Under Negotiation", "Sold" |
| `ownerId` | `String` (FK → Party) | `ownerId` | `string` |
| `detailsJson` | `Json?` | — | — | Not in mock (used in seed.ts for BHK/size/furnishing) |
| — | — | `lastVerified` | `string` | E.g. "1 day ago", "2 days ago", "15 days ago" |

**ShortLoc Values Used**: `01-Schm140_Mayank`, `02-Bengali_Kanadia`, `03-Vijay_Nagar`, `04-Palasia_Square`, `05-Bhawarkuan_Main`, `06-Nipania_Bypass`, `07-Geeta_Bhawan`, `08-SAPNA_SANGEETA`, `09-Super_Corridor`, `10-Rau_Pithampur`.

---

#### Requirement
**Prisma**: L212–L236. **Mock**: `mockData.ts` L37–L44 (6 records).

| Field | Prisma Type | Mock Field | Mock Type |
|-------|------------|------------|-----------|
| `id` | `String @id` | `id` | `string` | E.g. `'R-2001'` |
| `clientId` | `String` (FK → Party) | `clientId` | `string` |
| `category` | `PropertyCategory` | `category` | `string` |
| `intent` | `Intent` | `intent` | `string` | Values: "RENT", "BUY" |
| `preferredShortLocs` | `String[]` | `preferredShortLocs` | `string[]` |
| `minBudget` | `Float?` | `minBudget` | `number` |
| `maxBudget` | `Float?` | `maxBudget` | `number` |
| `status` | `RequirementStatus` | `status` | `string` | All mock records: "Active" |

---

#### Match
**Prisma**: L238–L252. **Mock**: `mockData.ts` L46–L53 (6 records).

| Field | Prisma Type | Mock Field | Mock Type |
|-------|------------|------------|-----------|
| `id` | `String @id` | `id` | `string` | E.g. `'M-1'` |
| `requirementId` | `String` (FK) | `requirementId` | `string` |
| `propertyId` | `String` (FK) | `propertyId` | `string` |
| `score` | `Float` | `score` | `number` | Values: 60.0, 75.0, 88.0, 92.0, 94.0, 95.5 |
| `tier` | `MatchTier` | `tier` | `string` | Values: "HIGH", "GOOD", "POSSIBLE" |
| `scoreBreakdown` | `Json?` | `scoreBreakdown` | `object` | See below |
| `status` | `MatchStatus` | `status` | `string` | Values: "SHARED", "SUGGESTED", "VISIT_SCHEDULED", "SHORTLISTED" |
| `rejectReason` | `String?` | — | — | Not in mock |

**Score Breakdown Examples**:
- `{ location: 'PASS', budget: 'PASS', bhk: 'PASS' }` (score 95.5)
- `{ location: 'PASS', budget: 'PASS', bhk: 'WARNING (Requested 3, found 2)' }` (score 75.0)
- `{ location: 'PASS', budget: 'WARNING (Property price exceeds budget by 40k)' }` (score 60.0)

---

#### Visit
**Prisma**: L289–L308. **Mock**: `mockData.ts` L55–L87 (4 records).

| Field | Prisma Type | Mock Field | Mock Type |
|-------|------------|------------|-----------|
| `id` | `String @id` | `id` | `string` | E.g. `"V-4001"` |
| `propertyId` | `String` (FK) | `propertyId` | `string` |
| `requirementId` | `String?` (FK) | `requirementId` | `string` |
| `agentId` | `String` (FK → User) | `agentId` | `string` |
| `status` | `VisitStatus` | `status` | `string` | Values: "ASSIGNED", "COMPLETED", "SUBMITTED", "SCHEDULED" |
| `plannedDate` | `DateTime` | `plannedDate` | `string` (ISO) |
| `expectedCoords` | `Json?` | — | — | Not in mock; hardcoded in AgentVisitExecution |
| `actualCoords` | `Json?` | — | — | Not in mock |
| `gpsValidation` | `GpsValidation?` | — | — | Not in mock |
| `checklistJson` | `Json?` | `checklistJson` | `object \| null` |
| `photosJson` | `Json?` | `photosJson` | `string[] \| null` |
| `outcomeJson` | `Json?` | `outcomeJson` | `object \| null` |

---

#### Opportunity
**Prisma**: L310–L332. **Mock**: `mockData.ts` L89–L105 (3 records).

| Field | Prisma Type | Mock Field | Mock Type |
|-------|------------|------------|-----------|
| `id` | `String @id` | `id` | `string` | E.g. `"OPP-5001"` |
| `propertyId` | `String` (FK) | `propertyId` | `string` |
| `requirementId` | `String?` (FK) | `requirementId` | `string \| null` |
| `buyerId` | `String?` (FK → Party) | `buyerId` | `string` |
| `sellerId` | `String?` (FK → Party) | `sellerId` | `string` |
| `responsibleId` | `String` (FK → User) | `responsibleId` | `string` |
| `expectedValue` | `Float?` | `expectedValue` | `number` |
| `expectedCommission` | `Float?` | `expectedCommission` | `number` |
| `probability` | `Float?` | `probability` | `number` | Values: 80, 100, 100 |
| `stage` | `OpportunityStage` | `stage` | `string` | Values: "Negotiation", "Won" |

---

#### Transaction
**Prisma**: L334–L349. **Mock**: `mockData.ts` L107–L123 (3 records).

| Field | Prisma Type | Mock Field | Mock Type |
|-------|------------|------------|-----------|
| `id` | `String @id` | `id` | `string` | E.g. `"TRX-6001"` |
| `opportunityId` | `String` (FK) | `opportunityId` | `string` |
| `propertyId` | `String` (FK) | `propertyId` | `string` |
| `transactionValue` | `Float` | `value` | `number` |
| `transactionType` | `String` | `type` | `string` | Values: "SALE", "RENT" |
| `commissionAmount` | `Float` | `commissionAmt` | `number` |
| `commissionPercent` | `Float` | `commissionPct` | `number` | Values: 2.0, 100.0 |
| `paymentStatus` | `String` | `status` | `string` | Values: "RECEIVED", "PENDING" |
| `closedAt` | `DateTime` | `closedDate` | `string` (ISO) |

---

#### User
**Prisma**: L351–L369. **Mock**: `mockData.ts` L4–L11 (6 records).

| Field | Prisma Type | Mock Field | Mock Type |
|-------|------------|------------|-----------|
| `id` | `String @id` | `id` | `string` | `u1`–`u6` |
| `name` | `String` | `name` | `string` |
| `email` | `String @unique` | `email` | `string` |
| `passwordHash` | `String` | — | — | Not in mock (seed uses `password123` bcrypt hash) |
| `role` | `UserRole` | `role` | `string` | Values: "SUPER_ADMIN", "OFFICE_EXECUTIVE", "AGENT", "CLIENT" |
| `status` | `String` | `status` | `string` | Values: "Active", "Inactive" |
| — | — | `lastLogin` | `string` | E.g. "Oct 26, 10:15 AM" |
| — | — | `partyId` | `string?` | Only for CLIENT user `u4` → links to party `p4` |

---

#### ActivityLog
**Prisma**: L254–L269. **Mock**: `mockData.ts` L137–L148 (10 records).

| Field | Mock Field | Type | Values Used |
|-------|------------|------|-------------|
| `id` | `id` | `string` | `'AL-1'`..`'AL-10'` |
| `type` | `type` | `string` | "CALL", "PROPERTY_SHARE", "VISIT", "FOLLOWUP", "WHATSAPP", "MEETING", "STATUS_CHANGE", "EMAIL", "TASK" |
| `linkedPartyId` | `linkedPartyId` | `string?` | |
| `linkedLeadId` | `linkedLeadId` | `string?` | |
| `linkedRequirementId` | `linkedRequirementId` | `string?` | |
| `linkedPropertyId` | `linkedPropertyId` | `string?` | |
| `linkedOpportunityId` | `linkedOpportunityId` | `string?` | |
| `notes` | `notes` | `string` | |
| `createdById` | `createdById` | `string` | |
| `occurredAt` / `createdAt` | `createdAt` | `string` (ISO) | |

---

#### FollowUp
**Mock**: `mockData.ts` L132–L135 (2 records).

| Field | Type | Values |
|-------|------|--------|
| `id` | `string` | `'F-3001'`, `'F-3002'` |
| `client` | `string` | "Amit Jain", "Rahul Verma" |
| `type` | `string` | "Opportunity", "Requirement" |
| `purpose` | `string` | |
| `priority` | `string` | "High", "Medium" |
| `status` | `string` | "PENDING" (both) |
| `date` | `string` (ISO) | One in past, one in future |

---

#### Call
**Mock**: `mockData.ts` L150–L159 (8 records).

| Field | Type | Values Used |
|-------|------|-------------|
| `id` | `string` | `'C-1'`..`'C-8'` |
| `partyId` | `string` | |
| `leadId` | `string?` | |
| `type` | `string` | "Outbound", "Inbound", "Missed" |
| `outcome` | `string` | "Connected", "No Answer", "Call Back Later", "Missed", "Busy", "Wrong Number" |
| `duration` | `number` | Minutes (0–15) |
| `callerId` | `string` | Staff user ID |
| `remarks` | `string` | |
| `date` | `string` (ISO) | |

---

#### Task
**Mock**: `mockData.ts` L161–L169 (7 records).

| Field | Type | Values Used |
|-------|------|-------------|
| `id` | `string` | `'T-1'`..`'T-7'` |
| `title` | `string` | |
| `type` | `string` | "Verification", "Documentation", "Admin", "Internal" |
| `assignedToId` | `string` | |
| `dueDate` | `string` (ISO) | |
| `priority` | `string` | "Critical", "High", "Medium", "Low" |
| `status` | `string` | "To Do", "In Progress", "Overdue", "Done" |
| `linkedRecord` | `string` | E.g. "P-1005", "OPP-5002", "R-2001" |
| `description` | `string` | |

---

#### AgentStats
**Mock**: `mockData.ts` L171–L175 (3 records).

| Field | Type | Values |
|-------|------|--------|
| `agentId` | `string` | `'u3'`, `'u5'`, `'u6'` |
| `status` | `string` | "On Visit", "Available", "Off Duty" |
| `todayVisits` | `number` | 0–2 |
| `weekCompleted` | `number` | 0–5 |
| `rating` | `number` | 4.0–4.8 |
| `lastLocation` | `string` | "Vijay Nagar", "Palasia Square", "Bhawarkuan" |

---

#### AuditLog
**Prisma**: L371–L383. **Mock**: `mockData.ts` L177–L190 (12 records).

| Field | Type | Values Used |
|-------|------|-------------|
| `id` | `string` | `'A-1'`..`'A-12'` |
| `timestamp` | `string` (ISO) | |
| `userId` | `string` | |
| `action` | `string` | "Status Changed", "Created", "Updated", "Deleted" |
| `entityType` | `string` | "Opportunity", "Lead", "Property", "User", "Visit", "Transaction", "Requirement", "Task", "Match", "Alert Setting" |
| `entityId` | `string` | |
| `summary` | `string` | |

---

### 3.4 Entity Relationship Diagram

```
Party (1) ──┬──< Lead (N)
             ├──< Property (N) [as Owner]
             ├──< Requirement (N) [as Client]
             ├──< Opportunity (N) [as Buyer]
             └──< Opportunity (N) [as Seller]

User (1) ──┬──< Lead (N) [assignedTo]
            ├──< Requirement (N) [assignedTo]
            ├──< Visit (N) [as Agent]
            ├──< Opportunity (N) [responsible]
            ├──< ActivityLog (N) [createdBy]
            ├──< FollowUp (N) [responsible]
            └──< AuditLog (N) [changedBy]

Requirement (1) ──< Match (N)
Property (1) ──────< Match (N)
Match links Requirement ←→ Property

Requirement (1) ──< Visit (N)
Property (1) ──────< Visit (N)

Property (1) ──< Opportunity (N)
Requirement (1?) ──< Opportunity (N)

Opportunity (1) ──< Transaction (N)
Property (1) ──────< Transaction (N)
```

---

## 4. Business Logic

### 4.1 Matching Engine Scoring Logic

**File**: [`src/pages/MatchingWorkspace.tsx`](src/pages/MatchingWorkspace.tsx) L7–L30, L52–L60  
**File**: [`src/lib/mockData.ts`](src/lib/mockData.ts) L46–L53

The matching engine is **not computed in the frontend**. Scores and tiers are **pre-defined in mock data**. The "Run Matching" button (L62–L71) simulates a 1.5s delay and then displays existing `mockMatches` filtered by the selected requirement ID.

**Score → Tier Mapping** (from `TierBadge`, L7–L23):
- `score >= 90` → `HIGH` (emerald green)
- `score >= 75` → `GOOD` (blue)
- `score >= 60` → `POSSIBLE` (amber)

**"Why this match?" Checklist** (L222–L236):
- Each entry in `scoreBreakdown` is an object like `{ criteria: result }`.
- If `result.startsWith('PASS')` → shown with green ✓ CheckCircle2 icon.
- Otherwise (e.g. `'WARNING (...)'`) → shown with amber ⚠ AlertTriangle icon.
- Criteria names are capitalized and displayed alongside the full result string.

**Score Breakdown Structure** (from mock data):
| Criteria | Possible Values |
|----------|----------------|
| `location` | `"PASS"` |
| `budget` | `"PASS"`, `"WARNING (Property price exceeds budget by 40k)"` |
| `bhk` | `"PASS"`, `"WARNING (Requested 3, found 2)"` |

**Matching Weight Configuration** (in Settings page, not used by actual logic):
- Location: 40, Budget: 30, Type: 20, Availability: 10 (default weights summing to 100).

---

### 4.2 Stale / Aging Record Detection Logic

**File**: [`src/lib/staleness.ts`](src/lib/staleness.ts) (156 lines)

#### Default Thresholds (L47–L51):
```
staleLeadDays: 7
unverifiedInventoryDays: 5
stalledOpportunityDays: 7
```

#### Terminal Statuses (always excluded):
- **Properties** (L33): `["Sold", "Rented", "Leased", "Withdrawn"]`
- **Leads** (L83): `["Lost", "Converted"]`
- **Opportunities** (L129): `["Won", "Lost"]`

#### `getStaleProperties(thresholdDays = 5)` (L57–L74):
1. Filter `mockProperties` where `status ∉ TERMINAL_STATUSES`.
2. Parse `lastVerified` string using regex `/^(\d+)\s*days?\s*ago$/i` → extract numeric days.
3. Include if `days > thresholdDays`.
4. Return `StaleRecord[]` with `ageDays = parseDaysAgo(lastVerified)`.

**With default threshold (5 days)**, returns properties: P-1007 (8 days), P-1008 (10 days), P-1009 (15 days). P-1010 (20 days) is excluded because status = "Sold".

#### `getStaleLeads(thresholdDays = 7)` (L80–L116):
1. Filter `mockLeads` where `status ∉ ["Lost", "Converted"]`.
2. Parse `lastActivity` using regex `/(\\d+)\\s*(hour|day|week|month)/i`.
3. Convert to days: hours → value/24, days → value, weeks → value×7, months → value×30.
4. Include if `days >= thresholdDays`.

**With default threshold (7 days)**, returns: no records (highest is L-1003 at 3 days).

#### `getStalledOpportunities(_thresholdDays = 7)` (L126–L140):
1. Filter `mockOpportunities` where `stage ∉ ["Won", "Lost"]`.
2. **Always returns all non-terminal** (threshold parameter is accepted but unused — mock data lacks `lastActivity` timestamps).
3. Returns with `ageDays: 0`, `lastActivity: "—"`.

**Current result**: OPP-5001 (stage "Negotiation").

#### `getAllStaleRecords(thresholds?)` (L146–L155):
Merges default thresholds with overrides, calls all three functions, concatenates results.

---

### 4.3 Commission Aggregation Logic

**File**: [`src/pages/Commissions.tsx`](src/pages/Commissions.tsx) L30–L77

**Algorithm** (for each non-CLIENT user):
1. Find all opportunities where `responsibleId === staff.id` (L34).
2. Find all transactions where `opportunityId ∈ staffOppIds` (L38).
3. Aggregate per staff:
   - `totalCommission`: Sum of all `trx.commissionAmt` (L47).
   - `paidCommission`: Sum where `trx.status === "RECEIVED"` (L48).
   - `pendingCommission`: Sum where `trx.status === "PENDING" || "PARTIAL"` (L49).
   - `thisMonthTotal`: Sum where `closedDate` month/year matches current (L52).
   - `lastMonthTotal`: Sum where `closedDate` month/year matches previous month (L54).
4. **MoM % Change** (L59–L64):
   - If `lastMonthTotal > 0`: `((thisMonth - lastMonth) / lastMonth) * 100`
   - If `lastMonthTotal === 0 && thisMonthTotal > 0`: `100` (representing ∞ growth)
   - Else: `0`
5. Results sorted by `totalCommission` descending (L77).

---

### 4.4 Other Computed Fields

| Computed Field | Location | Logic |
|----------------|----------|-------|
| **Match Count on Requirements** | `Requirements.tsx` | `mockMatches.filter(m => m.requirementId === req.id).length` |
| **Active Requirements Count** | `OfficeExecutiveDashboard.tsx` L18 | `mockRequirements.filter(r => r.status === 'Active').length` |
| **Active Inventory Count** | `OfficeExecutiveDashboard.tsx` L19 | `mockProperties.filter(p => p.status === 'Available' \|\| p.status === 'Active').length` |
| **Pending Follow-ups Count** | `Sidebar.tsx` L77, `OfficeExecutiveDashboard.tsx` L20 | `mockFollowUps.filter(f => f.status === "PENDING").length` |
| **Follow-up Status Derivation** | `FollowUps.tsx` L51–L59 | If status is `PENDING` and `date < now`, derive as `OVERDUE` |
| **Demand-Supply Gap** | `DemandSupply.tsx` L16–L68 | Per category: Demand = active requirements count, Supply = available/active properties count, Gap = Demand − Supply |
| **Price Formatting** | Various | `>= 10000000` → Cr, `>= 100000` → L, else comma-separated |
| **Haversine Distance** | `AgentVisitExecution.tsx` L21–L33 | Standard formula with R = 6371000m |

---

## 5. Role-Based Access Control

### 5.1 Page-Level Access

| Page | Super Admin | Office Executive | Agent | Client |
|------|:-----------:|:----------------:|:-----:|:------:|
| Dashboard `/` | ✅ (OE Dashboard) | ✅ (OE Dashboard) | ✅ (Agent Dashboard) | ✅ (Client Portal) |
| Leads `/leads` | ✅ | ✅ | ❌ (not in nav) | ❌ |
| Parties `/parties` | ✅ | ✅ | ❌ | ❌ |
| Inventory `/inventory` | ✅ | ✅ | ❌ | ❌ |
| Requirements `/requirements` | ✅ | ✅ | ❌ | ❌ |
| Matching `/matching` | ✅ | ✅ | ❌ | ❌ |
| Demand-Supply `/demand-supply` | ✅ | ✅ | ❌ | ❌ |
| Follow-ups `/follow-ups` | ✅ | ✅ | ✅ (filtered) | ❌ (blocked) |
| Telecalling `/telecalling` | ✅ | ✅ | ❌ | ❌ |
| Tasks `/tasks` | ✅ (all) | ✅ (all) | ✅ (own only) | ✅ (own only) |
| Timeline `/timeline` | ✅ | ✅ | ❌ | ❌ |
| Visits `/visits` | ✅ | ✅ | ✅ | ❌ |
| Visit Review `/visits/review` | ✅ | ✅ | ✅ | ❌ |
| Visit Execution `/agent/visit/:id` | ✅ | ✅ | ✅ | ✅ |
| Field Staff `/field-staff` | ✅ | ✅ | ❌ | ❌ |
| Opportunities `/opportunities` | ✅ | ✅ | ❌ | ❌ |
| Transactions `/transactions` | ✅ | ✅ | ❌ | ❌ |
| Commissions `/commissions` | ✅ (in-page check) | ❌ (blocked) | ❌ | ❌ |
| User Management `/user-management` | ✅ | ❌ | ❌ | ❌ |
| Settings `/settings` | ✅ | ❌ | ❌ | ❌ |
| Audit `/audit` | ✅ (in-page check) | ❌ (blocked) | ❌ | ❌ |
| Alerts `/alerts` | ✅ (in-page check) | ❌ (blocked) | ❌ | ❌ |
| Reports `/reports` | ✅ | ❌ | ❌ | ❌ |
| Client Portal routes | ❌ | ❌ | ❌ | ✅ |

> **Note**: "Not in nav" means the route exists and is accessible by URL but doesn't appear in the sidebar. Only Commissions, Audit, and Alerts have **explicit in-page role checks** that block access. Other pages rely on sidebar visibility.

### 5.2 Element-Level Access

| Element | Restriction | Implementation |
|---------|-------------|----------------|
| **Commissions page** | Super Admin only | `Commissions.tsx` L11–L17: `if (role !== "Super Admin")` shows blocked message |
| **Audit page** | Super Admin only | `Audit.tsx` L23–L29: same pattern |
| **Alerts config page** | Super Admin only | `Alerts.tsx` L19–L25: same pattern |
| **Follow-ups "New Follow-up" button** | Hidden for Agent | `FollowUps.tsx` L348: conditional render |
| **Follow-ups "Responsible" filter** | Hidden for Agent | `FollowUps.tsx` L411: conditional render |
| **Follow-ups data** | Agent sees only assigned | `FollowUps.tsx` L161–L163: filters by agent user ID |
| **Follow-ups page** | Client blocked entirely | `FollowUps.tsx` L187–L193: shows message |
| **Tasks data** | Agent/Client see only assigned | `Tasks.tsx` L55–L59: `getRoleUserId()` filtering |
| **Dashboard component** | Role-based switch | `Dashboard.tsx` L13–L23: different component per role |
| **Layout Sidebar** | Client gets no sidebar | `Layout.tsx` L17: Client gets custom header layout |
| **Sidebar nav items** | Role-filtered | `Sidebar.tsx` L178–L180: items filtered by `ROLE_NAV_ITEMS[role]` |
| **Opportunities Close as Won/Lost** | Only non-terminal stages | `Opportunities.tsx` L317: `stage !== "Won" && stage !== "Lost"` |

---

## 6. Auth / Session Handling

**Status**: Demo-grade mock authentication. No real credentials are validated.

### 6.1 Login Flow

**File**: [`src/pages/Login.tsx`](src/pages/Login.tsx) L17–L53

1. User selects a role from the 4-button grid (L86–L106).
2. Email/password fields are pre-filled but **never validated** against any backend or user store.
3. On form submit (`handleLogin`):
   - **Agent role**: Requests browser geolocation permission first. If granted, captures initial position, starts continuous GPS watching, sets role, navigates to `/`. If denied, shows error and blocks login.
   - **All other roles**: Immediately sets role and navigates to `/`.

### 6.2 Session Storage

**File**: [`src/context/RoleContext.tsx`](src/context/RoleContext.tsx) L60–L66, L135–L152

- **Storage key**: `crm_role` in `sessionStorage`.
- **On login** (L144–L145): `sessionStorage.setItem("crm_role", newRole)`.
- **On logout** (L146–L148): `sessionStorage.removeItem("crm_role")`.
- **On page load** (L60–L66): `RoleProvider` initializer reads `sessionStorage.getItem("crm_role")` and validates it against the 4 known role strings.
- **Session persistence**: Survives page refresh within the same browser tab (sessionStorage). Lost when tab is closed or new tab is opened.

### 6.3 Route Protection

**File**: [`src/App.tsx`](src/App.tsx) L36–L42

```typescript
function RequireAuth() {
  const { role } = useRole();
  if (!role) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}
```

All routes except `/login` are wrapped in `<Route element={<RequireAuth />}>` (L53). If `role` is null (no session), the user is redirected to `/login`.

### 6.4 Logout

**Files**: [`src/components/Header.tsx`](src/components/Header.tsx) L10–L13, [`src/components/Layout.tsx`](src/components/Layout.tsx) L12–L15

Both call `setRole(null)` + `navigate('/login')`. The `setRole(null)` function (RoleContext.tsx L135–L152) removes the session key and stops geolocation watching if active.

### 6.5 Sidebar Collapse Persistence

**File**: [`src/components/Sidebar.tsx`](src/components/Sidebar.tsx) L52–L61

- **Storage key**: `sidebarCollapsed` in `sessionStorage`.
- Initial state read from `sessionStorage.getItem('sidebarCollapsed') === 'true'`.
- Toggling calls `sessionStorage.setItem('sidebarCollapsed', newVal.toString())`.

---

## 7. Geolocation / Map Features

### 7.1 Agent Live Location Tracking

**File**: [`src/context/RoleContext.tsx`](src/context/RoleContext.tsx) L82–L132

#### What Triggers It
- **Login as Agent**: `Login.tsx` L29–L47 calls `navigator.geolocation.getCurrentPosition()` for initial fix, then `startWatching()` for continuous updates.
- **`startWatching()`** (L82–L132): Calls `navigator.geolocation.watchPosition()` with:
  - `enableHighAccuracy: true`
  - `timeout: 15000` (15 seconds)
  - `maximumAge: 5000` (5 seconds cache)

#### What Data It Captures
- `LocationData`: `{ lat: number, lng: number, accuracy: number }` — stored in React state via `setLocation()`.
- `address`: Reverse-geocoded string via Nominatim API.
- `locationError`: Error message if permission is revoked.

#### Reverse Geocoding
**Function**: `reverseGeocode(lat, lng)` (L28–L57)
- **API**: `https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lng}&zoom=16`
- **Headers**: `Accept-Language: en`
- **Response parsing**: Extracts `neighbourhood/suburb/hamlet/village` + `city/town/county`. Falls back to first 3 parts of `display_name`.
- **Throttling** (L101–L115): Only calls API when:
  - Position has moved more than `0.001` degrees lat or lng (~111 meters), **AND**
  - At least `10000ms` (10 seconds) have elapsed since last geocode call.

#### Where Location Data Is Used

| Feature | File | Usage |
|---------|------|-------|
| **Agent Dashboard Map** | `FieldAgentDashboard.tsx` L88–L93 | `<LiveMap lat={location.lat} lng={location.lng} accuracy={location.accuracy}>` |
| **Agent Dashboard Address** | `FieldAgentDashboard.tsx` L66–L68 | Displays reverse-geocoded `address` string |
| **Agent Dashboard Accuracy** | `FieldAgentDashboard.tsx` L72–L77 | Shows `±{accuracy}m accuracy` badge |
| **Visit Execution Navigation** | `AgentVisitExecution.tsx` L199–L206 | `<LiveMap>` with agent + target markers |
| **Visit Distance Calculation** | `AgentVisitExecution.tsx` L49–L60 | Haversine distance to hardcoded property coords |
| **Arrival Check-in** | `AgentVisitExecution.tsx` L227–L291 | Shows distance, color-codes proximity (< 200m = close) |

### 7.2 Map Component (Leaflet)

**File**: [`src/components/LiveMap.tsx`](src/components/LiveMap.tsx)
- **Library**: Leaflet (`leaflet` npm package, v1.9.4)
- **Tile Provider**: OpenStreetMap `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png` (free, no API key)
- **Marker Fix** (L4–L18): Overrides Leaflet's broken default marker icon paths for Vite bundler using `?url` imports.

### 7.3 Visit Arrival Distance Calculation

**File**: [`src/pages/AgentVisitExecution.tsx`](src/pages/AgentVisitExecution.tsx) L21–L60

- **Haversine formula** (L21–L33): Standard implementation with Earth radius `R = 6371000` meters.
- **Expected coordinates**: Hardcoded `{ lat: 22.7196, lng: 75.8577 }` (Scheme 140, Indore) (L16).
- **"At location" threshold**: `dist < 200` meters (L58).
- **Distance formatting** (L35–L38): `< 1000m` → `"Nm"`, else `"N.Xkm"`.

---

## 8. Sidebar / Navigation Structure

**File**: [`src/components/Sidebar.tsx`](src/components/Sidebar.tsx), [`src/types.ts`](src/types.ts) L38–L93

### 8.1 Group Structure (Internal Roles)

Defined in `INTERNAL_GROUPS` constant (Sidebar.tsx L15–L44):

| Group | Items |
|-------|-------|
| **DASHBOARD** | `/` |
| **CRM & LEADS** | `/leads`, `/parties` |
| **PROPERTY & INVENTORY** | `/inventory`, `/requirements`, `/matching`, `/demand-supply` |
| **ACTIVITIES & TASKS** | `/follow-ups`, `/telecalling`, `/tasks`, `/timeline` |
| **FIELD VISITS** | `/visits`, `/visits/review`, `/field-staff` |
| **OPPORTUNITIES** | `/opportunities`, `/transactions`, `/commissions` |
| **ADMIN** | `/user-management`, `/settings`, `/audit`, `/alerts` |

Each group only renders items that exist in the current role's `ROLE_NAV_ITEMS` array (L178–L180). Groups with zero accessible items are completely hidden.

### 8.2 Client Sidebar

Client role gets a **flat navigation** (no groups) with items (types.ts L87–L92):
- My Tasks → `/tasks`
- My Requirement → `/my-requirement` (renders PlaceholderPage)
- Shared Properties → `/shared-properties` (renders PlaceholderPage)
- My Visits → `/my-visits` (renders PlaceholderPage)

Client sidebar uses **blue** accent color and displays "RealEstateCRM | Portal" branding.

### 8.3 Badge/Count Logic

**Function**: `getBadgeCount(href)` (Sidebar.tsx L71–L80)

| Route | Badge Value |
|-------|-------------|
| `/leads` | `mockLeads.length` (= 4) |
| `/requirements` | `mockRequirements.length` (= 6) |
| `/inventory` | `mockProperties.length` (= 10) |
| `/visits` | `mockVisits.length` (= 4) |
| `/follow-ups` | `mockFollowUps.filter(f => f.status === "PENDING").length` (= 2) |
| All others | `null` (no badge) |

When collapsed, badges render as small amber dots. When expanded, they render as numeric chips.

### 8.4 Collapse/Expand Behavior

- **Whole-sidebar collapse** (L52–L62): `isSidebarCollapsed` boolean, persisted in `sessionStorage['sidebarCollapsed']`. Toggles between `w-64` (expanded) and `w-[72px]` (collapsed). When collapsed: only icons shown, group labels replaced with horizontal dividers, badges become dots.
- **Group-level collapse** (L64–L69): `collapsedGroups` record mapping group labels to boolean. Click on group header toggles. Default: all expanded. Uses `ChevronDown`/`ChevronRight` indicators. When sidebar is collapsed, group collapse is ignored (all items always visible).

### 8.5 Styling

- **Internal roles**: Amber accent (`text-amber-500` active icon, `bg-amber-500/20` badge). Dark sidebar (`bg-slate-900`).
- **Client role**: Blue accent (`text-blue-400` active icon, `bg-blue-500`).
- **Footer**: `© {year} RealEstateCRM` (collapsed: `©`).

---

## 9. Known Gaps / Incomplete Items

### 9.1 TODO Comments Found in Code

| File | Line | Comment |
|------|------|---------|
| [`src/lib/mockData.ts`](src/lib/mockData.ts) | L2 | `// TODO: Replace with real Prisma + Postgres queries when database is connected` |
| [`src/pages/dashboards/OfficeExecutiveDashboard.tsx`](src/pages/dashboards/OfficeExecutiveDashboard.tsx) | L14 | `// TODO: Replace with real Prisma + Postgres queries when database is connected` |

### 9.2 UI-Only Features (No Backend Logic)

| Feature | Location | Status |
|---------|----------|--------|
| **All "Save" / "Create" buttons** on forms | Leads, Parties, Inventory, Requirements, Visits, FollowUps, Tasks, Telecalling, UserManagement, Settings | No-op — data is never persisted |
| **Search bar in Header** | `Header.tsx` L18–L27 | Renders input but has no search implementation |
| **Notification bell** | `Header.tsx` L31–L33 | Renders icon with no notification system |
| **"Remember me" checkbox** | `Login.tsx` L148–L156 | Value never read |
| **"Forgot password?" link** | `Login.tsx` L159–L163 | `href="#"` — no-op |
| **Email/password validation** | `Login.tsx` L17–L53 | Credentials are never checked against any store |
| **"Start Navigation" button** | `AgentVisitExecution.tsx` L191–L194 | No actual navigation integration (e.g., Google Maps intent) |
| **Photo capture / "Add Photo"** | `AgentVisitExecution.tsx` L359–L362 | No camera API integration |
| **Matching engine "Run Matching"** | `MatchingWorkspace.tsx` L62–L71 | Simulated delay, displays existing mock matches, no real computation |
| **Kanban drag-and-drop** | `Opportunities.tsx` | Cards are clickable but cannot be dragged between columns |
| **"Confirm & Save" on Opportunities** | `Opportunities.tsx` L342–L347 | Close as Won/Lost forms rendered but save is no-op |
| **"View" / "Edit" action buttons** | Leads, Parties, Inventory, Matches, Transactions | All no-op |
| **"Mark Done" / "Reschedule"** | FollowUps.tsx | No-op |
| **"Approve" / "Reject" on Visit Review** | `VisitReview.tsx` | No-op |
| **Alert threshold persistence** | `Alerts.tsx` | Shows toast but doesn't save |
| **Settings "Save Changes"** | `Settings.tsx` | Triggers `alert()` only |
| **User status toggle switches** | `UserManagement.tsx` | No-op |

### 9.3 Hardcoded Values That Should Be Dynamic

| Value | Location | Current Value |
|-------|----------|---------------|
| Active Leads count | `OfficeExecutiveDashboard.tsx` L17 | `"42"` hardcoded |
| Overdue Follow-ups count | `OfficeExecutiveDashboard.tsx` L21 | `"3"` hardcoded |
| Agent dashboard stats | `FieldAgentDashboard.tsx` L38, L45, L52 | Today's Visits: `3`, Completed: `12`, Pending: `1` — all hardcoded |
| Client Portal client ID | `ClientPortal.tsx` L13 | `clientId = 'p4'` hardcoded |
| Client Portal consultant | `ClientPortal.tsx` | "Aman Desai" hardcoded |
| Visit property data | `AgentVisitExecution.tsx` L136–L158 | Property name, client, address all hardcoded |
| Visit expected coords | `AgentVisitExecution.tsx` L16 | `{ lat: 22.7196, lng: 75.8577 }` hardcoded |
| Staff performance table | `Reports.tsx` Section C | Data largely hardcoded in template |
| Demo user display name | `Header.tsx` L41 | Always shows "Demo User" |
| Client layout user name | `Layout.tsx` L34 | Always shows "Vikram Singh" |
| Opportunity closure agents | `Opportunities.tsx` L274–L276 | Hardcoded "Aman Desai", "Neha Kapoor" |

### 9.4 Client Routes Without Implementations

These routes are in `ROLE_NAV_ITEMS` for `Client` (types.ts L87–L92) but map to `PlaceholderPage` since no dedicated route components exist:
- `/my-requirement`
- `/shared-properties`
- `/my-visits`

The Client Portal (`ClientPortal.tsx`) is rendered at `/` (via Dashboard.tsx) and provides some of this functionality, but the dedicated route pages are unimplemented.

### 9.5 Prisma Not Wired to Frontend

The Prisma schema (`prisma/schema.prisma`) and seed file (`prisma/seed.ts`) define a complete PostgreSQL data model with proper relations, but the frontend exclusively uses `src/lib/mockData.ts` hardcoded arrays. There is no API layer, no database connection, and no data fetching.

### 9.6 Missing Features for Production

- No real authentication (JWT, sessions, OAuth)
- No API layer (REST or GraphQL)
- No file upload for visit photos
- No real-time notifications
- No email/SMS integration
- No WhatsApp integration (activity type exists but no actual messaging)
- No data export (CSV/PDF)
- No pagination on any list/table
- No sorting capability on tables
- No data validation beyond HTML `required` attributes
- No error boundaries
- No offline support
- No multi-tenancy
- No `ClientPortal.tsx` dedicated routes
- Opportunity `history` property referenced in UI but never populated in mock data

---

*End of Technical Specification*
