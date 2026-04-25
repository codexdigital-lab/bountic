**Bountic**
Zero-friction, autonomous USDC bounties for the agentic open-source economy.

### 1. Recommended Tech Stack (Hackathon Optimized)
* **Fullstack Framework:** Next.js (TypeScript). You can use Next.js API Routes for your webhooks and backend logic, and React for the frontend dashboard. This keeps everything in one repo.
* **Database:** Supabase (PostgreSQL). It’s perfect for hackathons—gives you instant APIs, database webhooks if needed, and easy GitHub OAuth integration.
* **GitHub Integration:** Use the `octokit` library for Node.js. It makes interacting with the GitHub API seamless.
* **Locus Integration:** We can use locus SDK, or standard `fetch` calls to the Locus Beta API (`https://beta-api.paywithlocus.com`).

---

### 2. Core Database Schema (Supabase/Postgres)
Keep it lean. You only need three core tables to make the state machine work:

* **`users`**: 
    * `github_username` (String, Primary Key)
    * `locus_wallet_address` (String, Nullable)
    * `email` (String)
* **`bounties`**:
    * `issue_id` (String, Primary Key - e.g., `owner/repo#42`)
    * `status` (Enum: `OPEN`, `LOCKED`, `PAID`)
    * `total_amount` (Float)
    * `ledger_comment_id` (String - to edit the ledger comment in place)
* **`funding_events`**:
    * `id` (UUID)
    * `issue_id` (Foreign Key -> Bounties)
    * `funder_username` (String)
    * `amount` (Float)
    * `locus_checkout_id` (String)
    * `payment_status` (Enum: `PENDING`, `SUCCESS`)

---

### 3. The GitHub App: Detailed Event Flow

Your Next.js API route (e.g., `/api/github/webhook`) will listen for specific GitHub events and route them to handler functions.

#### Event A: `issue_comment.created` (The Funding Trigger)
1.  **Parse:** The webhook hits your server. Check if the comment starts with the slash command (e.g., `/bounty 20`). Extract the numeric amount (`20`).
2.  **Generate Checkout:** Call the Locus endpoint to generate a `CheckoutWithLocus` session for the specified amount.
3.  **Post Temporary Reply:** Use `octokit.rest.issues.createComment` to reply to the user: *"⏳ Generating secure Locus checkout..."*
4.  **Edit to Paywall:** Once the checkout link is ready, use `octokit.rest.issues.updateComment` to edit that exact text to: *"⚡️ Lock in your $20 USDC bounty here: [Checkout Link]"*

#### Event B: Locus Webhook `checkout.success` (The Escrow Lock)
1.  **Verify:** Confirm the payment cleared via Locus. Update the `funding_events` table to `SUCCESS`. 
2.  **Update DB Total:** Add the new amount to the `bounties.total_amount`.
3.  **Update label:** Use octokit to set label `Bounty: Active`
4.  **Update GitHub Ledger (Pinned Comment):** * *If it's the first funding:* Post a new comment acting as the Ledger (e.g., "| Funder | Amount |\n|---|---|\n| @user | $20 |") and immediately pin it. Save the `comment_id` to the DB.
    * *If it's an existing bounty:* Fetch the `ledger_comment_id` from the DB, and use `octokit` to edit it, appending the new sponsor and updating the total sum in the text.

#### Event C: `pull_request.opened` (The Agent Discovery)
1.  **Scan:** Check the PR description for linking keywords like `Fixes #42` or `Closes #42`.
2.  **Verify Bounty:** Query your DB. Does `issue_id #42` have an active bounty?
3.  **Notify:** If yes, use `octokit` to post the following comment on the PR:
    > *The issue associated with this PR has a **$65 USDC** bounty. After successful merging, an email will be sent to retrieve the bounty. For machines, the wallet address shall be retrieved from the PR description (preferably as a hidden HTML text, e.g., ``).*

#### Event D: `pull_request.closed` (The Merge & LLM Split)
1.  **Check Status:** Confirm `merged: true` in the GitHub webhook payload. 
2.  **Fetch Commits:** Use `octokit.rest.pulls.listCommits` to pull the PR diffs and identify all authors.
3.  **The LLM Call (Locus Wrapped API):** * Format a prompt containing the PR title, issue description, and the commit diffs.
    * Enforce JSON output: `{"splits": [{"username": "alice", "percentage": 100}]}`.
4.  **Propose Split:** Comment on the merged PR: *"🏁 Bounty Locked! The AI proposes distributing $65 to @alice (100%). Maintainer, reply with `/approve` or wait 24 hours for auto-release."*
5.  **Start Timer:** Push a job to a queue (like Redis or Upstash) to trigger the payout execution endpoint in exactly 24 hours if no manual override occurs.

#### Event E: `issue_comment.created` on a PR (The Payout Execution)
1.  **Trigger:** The maintainer comments `/approve` (or the 24h cron job successfully fires).
2.  **Wallet Resolution (The Waterfall):**
    * *Step 1:* Regex search the PR markdown description for the hidden agent tag: ``.
    * *Step 2:* If not found, query your `users` DB table to see if the GitHub username has a linked wallet.
    * *Step 3:* If not found, fallback to the public GitHub commit email associated with the PR author.
3.  **Locus Payout:** Call `POST https://beta-api.paywithlocus.com/api/pay/send` with the resolved address or email and the exact USDC split amounts.
4.  **Close Out:** Update the `bounties` status to `PAID` in the DB. Update the ledger comment with the transaction hash and change the label to `Bounty: Paid`

---

### 4. The Website Plan (Frontend)

Your web app acts as the command center for human developers and the public face of the project. It doesn't need to be massive; it just needs to be polished.

IMPORTANT Note: the website API has to be agent friendly, you could add a SKILLS.md that tells agents how to access the explore API and how to get paid using HTML comment <!-- locus-wallet: 0xaaaa --> (all details)
GET /api/explore          → all open bounties
GET /api/bounty/:issue_id → specific bounty details + checkout session URL
POST /api/bounty/fund     → programmatically create a checkout session

#### Page 1: Landing Page (`/`)
* **Hero Section:** "Zero-Friction Bounties for the Agentic Economy."
* **How it Works:** A simple 3-step visual (Comment `/bounty` → AI Merges PR → Locus Pays Instantly). There shall be multiple sections in landing page like a polished site.
* **CTA:** "Install GitHub App" (Links directly to your GitHub App installation URL).
Hero: Bold tagline, 3D/animated graphic of a GitHub PR turning into a USDC coin, and the "Install App" CTA.
Social Proof / Ticker: A scrolling marquee of "Recent Bounties Paid" (fake this with realistic dummy data for the demo if needed).
For Maintainers (Features): Highlight "Zero Clutter" (Issue fields over labels) and "Zero Cost" (Free escrow).
For Agents (The API): A terminal-style code block showing how a Python script can fetch open bounties and submit a PR.
Footer: Links to your GitHub repo, the Devfolio submission, and the Locus Hackathon docs.

#### Page 2: The Explorer (`/explore`)
* **The Feed:** A live, searchable list of all open bounties pulled from your Supabase database. 
* **Cards:** Each card shows the Repo Name, Issue Title, and the big `💰 $XX USDC` total. 
* **Filter:** "Show only issues funded by agents."

#### Page 3: Developer Dashboard (`/dashboard`)
* **Auth:** Must log in via GitHub OAuth.
* **Wallet Linking Component:** A clean UI input where they paste their Locus Smart Wallet address. This updates the `locus_wallet_address` column in the `users` table. 
* **Earnings Tracker:** A simple table showing their past completed bounties and Locus transaction hashes.

#### Page 4: The Checkout Bridge (`/checkout/[checkout_id]`)
* Since Locus provides an SDK/API for checkout, you might need a simple holding page on your domain where the user is redirected to actually authorize the USDC payment. This page displays: "Funding Issue #42 with $20 USDC" and embeds the `CheckoutWithLocus` component.