# Bountic Implementation Plan

## Overview
Zero-friction, autonomous USDC bounties for the agentic open-source economy.

## 0. Phase 1 Scope Freeze (Locked)

This section is the Phase 1 architecture and scope baseline. Any Phase 2+ work should follow these contracts.

### Canonical API Surface (MVP)

- `GET /api/explore` -> list all open bounties (agent-friendly)
- `GET /api/bounty/[owner]/[repo]/[issueNumber]` -> bounty details + checkout URL
- `POST /api/bounty/fund` -> create Locus checkout session for funding
- `POST /api/webhooks/github` -> GitHub App webhook receiver
- `POST /api/webhooks/locus` -> Locus webhook receiver (`checkout.success`)

### Canonical State Machine

- `OPEN`: bounty has funds and is available for PR work
- `LOCKED`: linked PR merged, payout split proposed, waiting `/approve` (or later auto-release)
- `PAID`: payout executed and ledger finalized

Allowed transitions:
- funding success -> `OPEN`
- merged PR with active bounty -> `LOCKED`
- payout success -> `PAID`

### MVP vs Post-MVP

MVP (in-scope):
- Full Event A/B/C/E flow
- Event D with deterministic split proposal (100% to PR author)
- Maintainer `/approve` execution path
- Wallet waterfall resolution: PR hidden tag -> users table -> commit email

Post-MVP (out-of-scope for hackathon core):
- LLM-based split computation
- 24h auto-release queue/timer
- complex multi-author split arbitration UI

---

## 1. Project Setup

### Dependencies
Use pnpm install
```json
"octokit": "^3",
"@supabase/supabase-js": "^2",
"locus-agent-sdk": "latest"
```

### Environment Variables (.env.example)
```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_KEY=
SUPABASE_PUBLISHABLE_KEY=
SUPABASE_ANON_KEY=

# GitHub App
GITHUB_APP_ID=
GITHUB_APP_PRIVATE_KEY=
GITHUB_WEBHOOK_SECRET=

# Locus (Beta)
LOCUS_API_KEY=  # starts with claw_beta_

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 2. Database Schema (Supabase)

### Tables

**users**
Use supabase auth for authentication. feel free to change the PLAN if u think
| Column | Type | Notes |
|-------|------|-------|
| github_username | TEXT | PRIMARY KEY |
| locus_wallet_address | TEXT | Nullable |
| email | TEXT | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |

**bounties**
| Column | Type | Notes |
|-------|------|-------|
| issue_id | TEXT | PRIMARY KEY (format: "owner/repo#42") |
| status | TEXT | ENUM: OPEN, LOCKED, PAID |
| total_amount | REAL | DEFAULT 0 |
| ledger_comment_id | TEXT | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |

**funding_events**
| Column | Type | Notes |
|-------|------|-------|
| id | UUID | PRIMARY KEY |
| issue_id | TEXT | REFERENCES bounties(issue_id) |
| funder_username | TEXT | |
| amount | REAL | |
| locus_checkout_id | TEXT | |
| payment_status | TEXT | ENUM: PENDING, SUCCESS |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |

### RLS Policies
- Public read access for bounties table
- Service role for all writes (webhook handler)

---

## 3. Backend API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/webhooks/github` | POST | GitHub App webhook receiver |
| `/api/webhooks/locus` | POST | Locus webhook receiver |
| `/api/explore` | GET | List open bounties (agent-friendly) |
| `/api/bounty/[owner]/[repo]/[issueNumber]` | GET | Get bounty details + checkout URL |
| `/api/bounty/fund` | POST | Create/fund a bounty (creates checkout session) |
| `/checkout/[sessionId]` | GET | Checkout bridge page on web app |
| `/api/auth/callback` | GET | GitHub OAuth callback |

---

## 4. GitHub App Event Handlers

### Event A: issue_comment.created
1. Check if comment starts with `/bounty XX`
2. Extract amount, generate Locus checkout session
3. Post "Generating secure Locus checkout..." comment
4. Edit to checkout link: "Lock in your $XX USDC bounty here: [Link]"

### Event B: Locus checkout.session.paid (webhook)
1. Verify payment, update funding_events to SUCCESS
2. Add amount to bounties.total_amount
3. Set label "Bounty: Active"
4. First funding: create ledger comment (pinned)
5. Subsequent: edit ledger comment with new funder

### Event C: pull_request.opened
1. Scan PR description for "Fixes #XX" or "Closes #XX"
2. Query DB for active bounty
3. Post comment: "This PR has a $XX USDC bounty..."

### Event D: pull_request.closed (merged)
1. Fetch PR commits to identify authors
2. Propose 100% to PR creator
3. // Post-MVP: implement 24h timer for auto-release
4. For demo: maintainer comments `/approve` to release immediately

### Event E: issue_comment.created on PR
1. Check for `/approve` command
2. Resolve wallet (hidden HTML > users table > commit email)
3. Call Locus payout API
4. Update bounty status to PAID, update ledger

---

## 5. Locus Integration (Beta API)

READ THE LOCUS SKILLS https://beta.paywithlocus.com/SKILL.md
Base URL for API = `https://beta-api.paywithlocus.com/api`

## 6. Frontend Pages

### Page 1: Landing (`/`)
- Hero: "Zero-Friction Bounties for the Agentic Economy"
- How it Works: 3-step visual (Comment /bounty → AI Merges PR → Locus Pays)
- CTA: "Install GitHub App"
- Marquee: Recent bounties (fake data for demo)
- Features sections, footer
Hero: Bold tagline, 3D/animated graphic of a GitHub PR turning into a USDC coin, and the "Install App" CTA.
Social Proof / Ticker: A scrolling marquee of "Recent Bounties Paid" (fake this with realistic dummy data for the demo if needed).
For Maintainers (Features): Highlight "Zero Clutter" (Issue fields over labels) and "Zero Cost" (Free escrow).
For Agents (The API): A terminal-style code block showing how a Python script can fetch open bounties and submit a PR.
Footer: Links to your GitHub repo, the Devfolio submission, and the Locus Hackathon docs.

### Page 2: Explorer (`/explore`)
- Live list of open bounties from Supabase
- Cards: Repo, Issue Title, Amount
- Filter: "Show only agent-funded"

### Page 3: Dashboard (`/dashboard`)
- GitHub OAuth login
- Wallet linking input (updates users.locus_wallet_address)
- Earnings table (past bounties + tx hashes)

### Page 4: Checkout (`/checkout/[sessionId]`)
- LocusCheckout component wrapper
- Display: "Funding Issue #XX with $XX USDC"

---

## 7. Agent-Friendly API Design

### Principles
- All responses include machine-readable data in HTML comments
- JSON response for programmatic access
- HTML content for human readability
- Agent metadata embedded for discovery

### API Endpoints

```bash
# List all open bounties
GET /api/bounties

# Response Format:
{
  "bounties": [
    {
      "issue_id": "owner/repo#42",
      "repo": "owner/repo",
      "issue_number": 42,
      "title": "Fix bug in login",
      "total_amount": 65,
      "status": "OPEN",
      "url": "https://github.com/owner/repo/issues/42"
    }
  ]
}
<!-- bountic:open:bounties:3 -->
<!-- bounty: owner/repo#42, amount: 65, status: OPEN -->
<!-- bounty: defunkt/hello#1, amount: 20, status: LOCKED -->

# Get single bounty
GET /api/bounties/owner/repo#42

# Response includes agent-friendly metadata:
{
  "issue_id": "owner/repo#42",
  "total_amount": 65,
  "status": "OPEN",
  "checkout_url": "https://bountic.com/checkout/session_abc123"
}
<!-- bounty: owner/repo#42, amount: 65 -->
<!-- locus-checkout: https://bountic.com/checkout/session_abc123 -->

# Fund a bounty (create checkout session)
POST /api/bounties/fund
{ issue_id: "owner/repo#42", amount: 20 }

# Response:
{
  "checkout_session_id": "session_abc123",
  "checkout_url": "https://bountic.com/checkout/session_abc123"
}
```

### Agent Workflow Support
1. Agent fetches `/api/bounties` to discover funded issues
2. Regex matches `<!-- bounty: (.*?) -->` for issue data
3. Posts PR with link to issue in description
4. After merge, maintainer approves with `/approve`
5. Bounty paid to wallet resolved from:
   - PR description: `<!-- locus-wallet: 0x... -->`
   - Or users table lookup by GitHub username
   - Or fallback to commit email

---

## 8. Implementation Order

1. Add dependencies, create .env.example
2. Create Supabase schema.sql + run in dashboard
3. Create Supabase client lib
4. Build webhook routes + handlers (`/api/webhooks/github`, `/api/webhooks/locus`)
5. Build Locus integration lib
6. Create all API routes (`/api/explore`, `/api/bounty/...`, `/api/bounty/fund`)
7. Build frontend pages
8. Create SKILLS.md for agents
9. Test end-to-end flow

---

## 9. Future Improvements (TODO)

- [ ] LLM-powered split decision (not always 100% to PR author)
- [ ] 24h auto-release timer (currently just /approve triggers payout)
- [ ] Multiple funders complex split logic
- [ ] Bounty marketplace / bidding
- [ ] Reputation system for agents
- [ ] Real-time notifications
