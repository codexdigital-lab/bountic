# Bountic Implementation Plan

## Overview
Zero-friction, autonomous USDC bounties for the agentic open-source economy.
Designed for both **humans** and **machines** (AI agents) to participate in open-source funding.

## Audience

### 1. Developers (Earners)
- Find bountied issues on GitHub or via Bountic explore
- Submit PRs to earn USDC when merged
- AI agents can discover and work on bountied issues

### 2. Maintainers & Funders
- Fund issues they can't solve themselves (lack of skill/time)
- Set bounties on issues they maintain
- Can fund via web app or GitHub comments

### 3. Machines (AI Agents)
- Discover bounties via public API
- Fork repo, solve issue, submit PR
- Automatic payout on merge + approve

---

## Funding Channels

| Channel | User | Description |
|---------|------|-------------|
| **Web App** | Human/Agent | Explore dashboard → Fund existing bounty via Locus checkout |
| **GitHub Comment** | Human | Comment `/bounty 50` on any GitHub issue |
| **API POST** | Agent | `POST /api/bounty/fund` with issue_id + amount |

---

## 0. Phase 1 Scope Freeze (Locked)

This section is the Phase 1 architecture and scope baseline. Any Phase 2+ work should follow these contracts.

### Canonical API Surface (MVP)

- `GET /api/explore` -> list all open bounties (agent-friendly, paginated, filterable)
- `GET /api/bounty/[owner]/[repo]/[issueNumber]` -> bounty details + funding events
- `POST /api/bounty/fund` -> create Locus checkout session for funding
- `POST /api/webhooks/github` -> GitHub App webhook receiver (issue_comment, pull_request)
- `POST /api/webhooks/locus` -> Locus webhook receiver (`checkout.session.paid`)

### Canonical State Machine

- `OPEN`: bounty has funds and is available for PR work
- `LOCKED`: linked PR merged, payout split proposed, waiting `/approve`
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
- Wallet resolution: PR hidden tag (`<!-- locus-wallet: 0x... -->`) -> users table

Post-MVP (out-of-scope):
- LLM-based split computation
- 24h auto-release queue/timer
- Complex multi-author split arbitration UI

---

## 1. Project Setup

### Dependencies
Use pnpm install
```json
"octokit": "^3",
"@supabase/supabase-js": "^2",
"@withlocus/checkout-react": "^1"
```

### Environment Variables (.env.example)
```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_KEY=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# GitHub App
GITHUB_APP_ID=
GITHUB_APP_PRIVATE_KEY=
GITHUB_WEBHOOK_SECRET=

# Locus
LOCUS_API_KEY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 2. Database Schema (Supabase)

### Tables

**users**
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
| ledger_comment_id | TEXT | GitHub comment ID |
| funded_by_agent | BOOLEAN | DEFAULT false |
| payout_tx_hash | TEXT | |
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
| locus_webhook_secret | TEXT | Per-session secret |
| payment_status | TEXT | ENUM: PENDING, SUCCESS |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |

**payout_events**
| Column | Type | Notes |
|-------|------|-------|
| id | UUID | PRIMARY KEY |
| issue_id | TEXT | REFERENCES bounties(issue_id) |
| recipient_username | TEXT | |
| amount | REAL | |
| locus_transaction_id | TEXT | |
| transaction_hash | TEXT | |
| status | TEXT | ENUM: PENDING, SUCCESS, FAILED |
| metadata | JSONB | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |

### RLS Policies
- Public read access for bounties, funding_events tables
- Service role for all writes (webhook handlers)

---

## 3. Backend API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/explore` | GET | List bounties with filtering, sorting, pagination |
| `/api/bounty/[owner]/[repo]/[issueNumber]` | GET | Get bounty details + funding events |
| `/api/bounty/fund` | POST | Create checkout session, returns checkout URL |
| `/api/webhooks/github` | POST | GitHub App webhook receiver |
| `/api/webhooks/locus` | POST | Locus webhook receiver |
| `/api/auth/callback` | GET | GitHub OAuth callback |

---

## 4. GitHub App Event Handlers

### Event A: issue_comment.created (on issue)
1. Check if comment starts with `/bounty XX`
2. Extract amount, generate Locus checkout session
3. Post "Generating secure Locus checkout..." comment
4. Edit to checkout link: "Lock in your $XX USDC bounty here: [Link]"

### Event B: Locus checkout.session.paid (webhook)
1. Verify webhook signature with per-session secret
2. Update funding_events to SUCCESS
3. Add amount to bounties.total_amount (recompute)
4. Set label "Bountic: Active" on GitHub issue
5. Create/edit ledger comment with funding table

### Event C: pull_request.opened
1. Query DB for active bounty on linked issue
2. Post comment: "⚡️ This PR has a $XX USDC bounty..."

### Event D: pull_request.closed (merged)
1. Update bounty status to LOCKED
2. Post comment: "🔒 Bounty locked. Use /approve to release funds."

### Event E: issue_comment.created (on PR)
1. Check for `/approve` command
2. Resolve wallet: PR hidden tag (`<!-- locus-wallet: 0x... -->`) -> users table
3. Call Locus payout API
4. Update bounty status to PAID
5. Post payout confirmation with tx hash

---

## 5. Agent-Friendly Design

All API responses include machine-readable metadata for AI agent discovery.

```bash
# List all open bounties
GET /api/explore?status=OPEN&sort=amount_desc

# Response:
{
  "bounties": [
    {
      "issue_id": "owner/repo#42",
      "owner": "owner",
      "repo": "repo",
      "issue_number": 42,
      "status": "OPEN",
      "total_amount": 65.00,
      "created_at": "2026-01-15T..."
    }
  ],
  "pagination": { "limit": 20, "offset": 0, "count": 1 }
}

# Get single bounty
GET /api/bounty/owner/repo/42

# Response includes funding events:
{
  "bounty": {
    "issue_id": "owner/repo#42",
    "status": "OPEN",
    "total_amount": 65.00,
    "funding_events": [
      { "funder_username": "alice", "amount": 50, "payment_status": "SUCCESS" }
    ]
  }
}

# Fund a bounty (web app or agent)
POST /api/bounty/fund
{ "issue_id": "owner/repo#42", "amount": 25, "funder_username": "bob" }

# Response:
{
  "success": true,
  "checkout_session_id": "sess_abc123",
  "checkout_url": "https://checkout.paywithlocus.com/sess_abc123"
}
```

### Agent Workflow
1. Agent fetches `/api/explore?status=OPEN`
2. Filters by repo, language, or amount threshold
3. Clones repo, reads issue, writes code
4. Submits PR linking to issue
5. On merge, maintainer runs `/approve`
6. Payout sent to wallet resolved from PR or users table

---

## 6. Frontend Pages

### Page 1: Landing (`/`)
- Hero: "Autonomous USDC bounties for open source"
- Stats: Total bounties, total funded, payouts made
- Featured bounties carousel
- How it works (3 steps)
- Why Bountic features (4 cards)
- Loom video placeholder
- CTA: "Explore Bounties" + "Add Bounty to Repo"

### Page 2: Explore (`/explore`)
- Filter bar: Status dropdown, sort (newest/amount)
- Bounty cards grid: repo, issue number, amount, status badge
- Pagination

### Page 3: Bounty Detail (`/bounty/[owner]/[repo]/[issueNumber]`)
- Issue header with status badge
- Total amount display (prominent, green)
- Fund button (if OPEN): opens Locus checkout
- Funding events table: funder, amount, status, date
- Payout transaction hash (if PAID)

---

## 7. Implementation Order

1. Phase 2: Project setup + env validation
2. Phase 3: Supabase schema + auth
3. Phase 4: Funding engine (webhooks)
4. Phase 5: PR lifecycle + payout
5. Phase 6.1: API endpoints
6. Phase 6.2: Frontend pages
7. Phase 6.3: GitHub OAuth + dashboard (future)

---

## 8. Future Improvements (TODO)

- [ ] LLM-powered split decision
- [ ] 24h auto-release timer
- [ ] Multi-funder complex split logic
- [ ] AI agent leaderboard / reputation
- [ ] Real-time notifications via Discord/Slack webhooks
- [ ] GitHub App installation flow for repo owners