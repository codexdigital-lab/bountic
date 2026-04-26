# Bountic - Label-Triggered Bounty Rails

## What changes now

Old model:
- Funding started from GitHub issue comments (`/bounty 20`)
- Approval started from PR comments (`/approve`)

New model:
- Funding lifecycle starts when maintainer adds `Bounty` label to issue
- Bounty page is the center of truth for funding + approval
- Funding happens on website with inline Locus checkout
- Maintainer payout approval happens on website after GitHub OAuth + permission check

PR linking policy:
- Count PR as competing only if PR body includes closing reference like `Fixes #123`

---

## Why this is better

- Cleaner maintainer workflow: label once, then manage from UI
- Better contributor UX: one beautiful issue page with context + money + history
- Better machine UX: stable, typed APIs instead of parsing chat commands
- Better auditability: append-only activity feed and deterministic ledger updates

---

## Experience blueprint

### Trigger
1. Maintainer labels an issue with `Bounty`
2. Webhook receives `issues.labeled`
3. Service ensures bounty row, syncs issue context, creates/updates ledger comment
4. Ledger comment links to Bountic page

### Bounty page (`/bounty/[owner]/[repo]/[issueNumber]`)
- Left column: issue context from GitHub
  - title + description
  - repo, labels, state
  - link back to issue
- Right column: bounty panel
  - large total amount
  - leaderboard by funder
  - add bounty checkout button
  - status badge (`OPEN`, `LOCKED`, `PAID`)
  - maintainer-only approve button when `LOCKED`
- Bottom: activity feed
  - funding events (with source tag: `WEB`/`API`)
  - competing PR records
  - lock and payout records with tx hash

### Competition + payout
- `pull_request.opened`: detect issue reference from PR body closing keywords (`Fixes/Closes/Resolves #123`)
- If issue has active bounty, record `PR_COMPETING`
- `pull_request.closed` merged + linked issue -> `LOCKED`
- Maintainer clicks approve on web page
- Service validates maintainer permission, sends payout, sets `PAID`

---

## Agent-friendly principles

### 1) Deterministic IDs and enums
- `issue_id` always `owner/repo#number`
- strict enums for `status`, `funding_source`, `activity_event_type`

### 2) No UI-only data
- Anything shown in UI also available via JSON APIs

### 3) Structured activity feed
- Normalized event payloads so agents can reason over timeline without NLP

### 4) Programmatic funding path stays open
- Keep `POST /api/bounty/fund` for autonomous funders

### 5) Wallet tagging convention
- Continue using hidden PR tag for machine-safe wallet resolution:
  - `<!-- locus-wallet: 0x... -->`

---

## Data additions required

### `bounties` additions
- issue metadata mirror: `issue_title`, `issue_body`, `issue_state`, `issue_url`
- payout lifecycle metadata: `winning_pr_number`, `winning_pr_author`, `winning_pr_url`
- timestamps and audit fields: `locked_at`, `paid_at`, `approved_by`

### `funding_events` additions
- `funding_source` enum: `WEB` | `API`

### new `activity_events` table
- per-issue append-only timeline
- event type enum:
  - `FUNDING_ADDED`
  - `PR_COMPETING`
  - `BOUNTY_LOCKED`
  - `PAYOUT_SENT`

---

## Delivery phases

### Phase 1
- Update docs + schema + DB types

### Phase 2
- Webhook refactor to label-trigger model
- Remove `/bounty` command webhook path
- Enforce PR linking via closing keywords only

### Phase 3
- API enhancements (issue context, leaderboard, activity)
- OAuth-backed maintainer permission check endpoint
- Approve payout endpoint

### Phase 4
- Build requested bounty page UI and checkout flow
- Show maintainer-only approve button in `LOCKED`

### Phase 5
- Hardening and QA
- Idempotency, retries, and ledger consistency checks
