# Bountic Plan (Label-First, Agent-Friendly)

## Product Direction

Bountic starts on **GitHub issue label** and executes funding + payout through a **web-native issue page**.

Trigger model:
- Maintainer adds label `Bounty` on an issue
- Bot handles `issues.labeled`
- Bot creates/updates one ledger comment pinned to the issue
- Ledger includes total bounty, status, and canonical Bountic issue URL

Funding model:
- No `/bounty 20` slash command flow
- Funding is done directly on Bountic issue page via Locus checkout
- API funding remains available for agents (`POST /api/bounty/fund`)

Approval model:
- No `/approve` slash command flow
- Maintainer approves payout from website
- GitHub OAuth + permission check gates the `Approve payment` action

PR competition rule:
- A PR is considered competing **only** when PR body contains a closing reference like `Fixes #123`

---

## Core UX Flow

1. Maintainer labels issue with `Bounty`
2. Bountic bot creates/updates ledger comment + deep link
3. Users open Bountic issue page (`/bounty/[owner]/[repo]/[issueNumber]`)
4. Users add funds via inline checkout
5. Activity feed records funding + competing PRs + lock + payout
6. On merged linked PR, bounty becomes `LOCKED`
7. Maintainer visits page, sees `Approve payment` button, confirms payout
8. Bounty becomes `PAID`, tx hash added to feed + ledger

---

## State Machine

- `OPEN`: label exists and bounty is fundable
- `LOCKED`: linked competing PR merged; waiting maintainer approval
- `PAID`: payout executed

Allowed transitions:
- `issues.labeled(Bounty)` -> ensure row -> `OPEN`
- `checkout.session.paid` -> recompute totals (still `OPEN` unless already `LOCKED`/`PAID`)
- `pull_request.closed(merged + Fixes #issue)` -> `LOCKED`
- maintainer approve payout -> `PAID`

Guardrails:
- Ignore new funding if status is `PAID`
- Preserve `LOCKED` unless explicitly paid/reset
- All state transitions append `activity_events`

---

## API Contracts (Agent-Friendly)

### Public Read APIs

- `GET /api/explore`
  - Returns machine-readable list of bounties
  - Supports filters: `status`, `min_amount`, sorting, pagination

- `GET /api/bounty/[owner]/[repo]/[issueNumber]`
  - Returns:
    - issue context (title/body/labels/state/url)
    - bounty totals/status
    - funder leaderboard
    - normalized activity feed
    - viewer capability flags (when authenticated): `can_approve_payment`

### Write APIs

- `POST /api/bounty/fund`
  - Creates Locus checkout session
  - Source tagged as `WEB` or `API`
  - Returns checkout session id + checkout url

- `POST /api/bounty/[owner]/[repo]/[issueNumber]/approve`
  - Auth required
  - Verifies user is maintainer/admin on repo
  - Verifies bounty is `LOCKED`
  - Executes payout and marks bounty `PAID`

### Webhooks

- `POST /api/webhooks/github`
  - Handles:
    - `issues` (`action=labeled`) for `Bounty`
    - `pull_request` (`opened`, `closed`)
  - PR link detection uses closing keywords in PR body (`Fixes #123` etc.)

- `POST /api/webhooks/locus`
  - Handles paid checkout events
  - Marks funding success
  - Recomputes totals
  - Syncs ledger comment

---

## Data Model

Tables:
- `bounties`
  - issue metadata mirror (title/body/state/url)
  - status + totals + ledger id
  - winning PR + approval/payout metadata
- `funding_events`
  - per-checkout rows
  - `funding_source`: `WEB` | `API`
  - payment status
- `activity_events`
  - append-only timeline for issue page
  - event types:
    - `FUNDING_ADDED`
    - `PR_COMPETING`
    - `BOUNTY_LOCKED`
    - `PAYOUT_SENT`
- `users`
  - GitHub username, wallet, email mapping

---

## Web Page Requirements

Route: `/bounty/[owner]/[repo]/[issueNumber]`

Layout:
- Left: issue context
  - title + description
  - repo, labels, open/closed status
  - GitHub issue link
- Right: bounty panel
  - prominent total (`💰 $85 USDC`)
  - funder leaderboard
  - `Add Bounty` inline checkout action
  - status badge (`OPEN` / `LOCKED` / `PAID`)
  - conditional `Approve payment` button for authorized maintainers
- Bottom: activity feed
  - `@alice added $20`
  - `@bob added $40 via API`
  - `PR #87 by @carol is competing`
  - `Bounty paid to @carol — tx 0x...`

---

## Agent Consumption Guarantees

- Stable `issue_id` format: `owner/repo#number`
- Consistent enum values for `status` and `event_type`
- Fully machine-readable timestamps (`ISO 8601`)
- Leaderboard and activity are deterministic projections from DB records
- `POST /api/bounty/fund` remains usable for autonomous agents

Suggested agent docs:
- Add a dedicated agent guide file documenting:
  - discover bounties via `/api/explore`
  - inspect details via `/api/bounty/...`
  - fund via `/api/bounty/fund`
  - include wallet tag in PR body: `<!-- locus-wallet: 0x... -->`

---

## Implementation Phases

### Phase 1 (Current)
- Update planning docs to new flow
- DB schema + generated DB types for:
  - issue context fields on `bounties`
  - `funding_source`
  - `activity_events`
  - lock/approve/payout metadata

### Phase 2
- GitHub webhook refactor
  - remove issue-comment funding command path
  - add `issues.labeled` handler for `Bounty`
  - enforce competing PR rule from closing keyword references

### Phase 3
- API upgrades
  - richer bounty detail payload (leaderboard/activity/issue context)
  - approve payout endpoint with OAuth + permission checks

### Phase 4
- Bounty detail page redesign to requested layout
  - inline checkout
  - maintainer-only approve action
  - activity timeline presentation

### Phase 5
- QA, docs, and hardening
  - webhook replay/idempotency checks
  - permission edge cases
  - transaction/ledger consistency
