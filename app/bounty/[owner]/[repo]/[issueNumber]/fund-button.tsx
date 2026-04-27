"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { fundBounty, type FundResponse } from "@/lib/api/client";
import { Loader2 } from "lucide-react";
import Link from "next/link";

type Props = {
  issueId: string;
  issueUrl: string;
};

export function FundButton({ issueId, issueUrl }: Props) {
  const [amount, setAmount] = useState("");
  const [displayName, setDisplayName] = useState("Anonymous");
  const [loading, setLoading] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  const handleFund = async () => {
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      setError("Please enter a valid amount");
      setTimeout(() => setError(null), 3000);
      return;
    }

    setShowDialog(true);
  };

  const handleConfirmFund = async () => {
    const numAmount = Number(amount);
    setLoading(true);
    setError(null);

    try {
      const response: FundResponse = await fundBounty({
        issue_id: issueId,
        amount: numAmount,
        funder_display_name: displayName.trim() || undefined,
        issue_url: issueUrl,
        funding_source: "WEB",
      });

      setCheckoutUrl(response.checkout_url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create funding");
    } finally {
      setLoading(false);
    }
  };

  if (checkoutUrl) {
    return (
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Ready to Fund</h3>
        <p className="text-zinc-400 mb-4">
          Click below to complete your payment via Locus Checkout
        </p>
        <Link
          href={checkoutUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center h-10 px-6 bg-green-500 hover:bg-green-600 text-black font-medium rounded-md transition-colors"
        >
          Open Locus Checkout
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
        <h3 className="mb-4 text-lg font-semibold">Fund This Bounty</h3>
        <div className="flex flex-col gap-4">
          <div>
            <Label htmlFor="amount" className="mb-2 block text-xs uppercase tracking-[0.2em] text-zinc-500">
              Amount (USDC)
            </Label>
            <Input
              id="amount"
              type="number"
              min="1"
              step="0.01"
              placeholder="Type 10.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="border-zinc-800 bg-zinc-950 font-mono text-zinc-100"
            />
          </div>
          <Button
            onClick={handleFund}
            disabled={loading}
            className="h-11 bg-emerald-400 font-medium text-black hover:bg-emerald-300"
          >
            Proceed
          </Button>
        </div>
        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-zinc-950 border-zinc-800">
          <DialogHeader>
            <DialogTitle>Confirm Funding</DialogTitle>
            <DialogDescription className="text-zinc-400">
              You are about to fund ${amount} USDC to this bounty.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="display-name" className="mb-2 block text-xs uppercase tracking-[0.2em] text-zinc-500">
              Name (optional)
            </Label>
            <Input
              id="display-name"
              type="text"
              placeholder="Anonymous"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="border-zinc-800 bg-zinc-950 text-zinc-100"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
              disabled={loading}
              className="border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmFund}
              disabled={loading}
              className="bg-emerald-400 font-medium text-black hover:bg-emerald-300"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Confirm & Continue"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}