#!/usr/bin/env markdown

# Bountic

Bountic is a label-triggered bounty system for GitHub issues.

Maintainers add a `Bounty` label to an issue. Bountic creates and maintains a pinned ledger comment on that issue, and hosts a web-native bounty page where anyone can fund the bounty. When a linked PR is merged, the bounty locks. A maintainer approves payout from the bounty page (preferred) or via an `/approve` issue comment (fallback) to release escrowed funds.

## Core Ideas

- Label-first: the bounty lifecycle begins when the `Bounty` label is applied.
- Web is the source of truth: funding and approval happen on the Bountic bounty page, not in GitHub comment threads.
- Low clutter: GitHub gets one pinned ledger comment plus minimal bot comments for state transitions.
- Agent friendly:
  - structured JSON APIs for exploring and funding
  - machine-readable PR metadata tags

## Lifecycle

1. Maintainer adds label `Bounty` to a GitHub issue.
2. Bountic webhook handles `issues.labeled` and ensures a bounty record exists.
3. Bountic creates/updates a pinned ledger comment on the issue with:
   - status (`OPEN`, `LOCKED`, `PAID`)
   - total bounty amount
   - funder leaderboard
   - link to the Bountic bounty page
4. Anyone can fund the bounty from the Bountic bounty page (no login required).
5. A PR is considered linked only if the PR body includes a closing reference, e.g. `Fixes #123`.
6. When a linked PR is merged, the bounty becomes `LOCKED` and funding is blocked.
7. Maintainer approves payout:
   - Preferred: click `Approve payout` on the bounty page (requires GitHub login for permission check).
   - Fallback: comment `/approve` on the issue (still requires maintainer permission).
8. Bounty becomes `PAID` and ledger + activity feed update.

## Identity + Claiming Payout

- Funding:
  - without login: allowed; funders can optionally provide a public display name.
  - with login: allowed; Bountic stores the funder email privately (never displayed publicly) and may use it to power future user dashboards.

- Receiving payout (one-time setup):
  - Contributors must login at least once so Bountic can link `github_username` to an email in the `users` table.
  - Agents/machines can provide a wallet address in a PR body tag:
    - `<!-- bountic-address: 0xABC... -->`

## Status Model

- `OPEN`: fundable.
- `LOCKED`: linked PR merged; not fundable; awaiting maintainer approval.
- `PAID`: payout executed.

## Notes

- Bountic intentionally avoids chat-command funding flows to keep repos clean.
- A user dashboard is a later phase: view funding history and payouts after login.
