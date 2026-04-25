"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fundBounty, type FundResponse } from "@/lib/api/client";
import { Loader2 } from "lucide-react";

type Props = {
  issueId: string;
  issueUrl: string;
};

export function FundButton({ issueId, issueUrl }: Props) {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFund = async () => {
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const funderUsername = prompt("Enter your GitHub username:") || "anonymous";
      const response: FundResponse = await fundBounty({
        issue_id: issueId,
        amount: numAmount,
        funder_username: funderUsername,
        issue_url: issueUrl,
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
        <a
          href={checkoutUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center h-10 px-6 bg-green-500 hover:bg-green-600 text-black font-medium rounded-md transition-colors"
        >
          Open Locus Checkout
        </a>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">Fund This Bounty</h3>
      <div className="flex flex-col sm:flex-row gap-4 items-end">
        <div className="w-full sm:w-40">
          <Label htmlFor="amount" className="text-zinc-400 mb-2 block">
            Amount (USDC)
          </Label>
          <Input
            id="amount"
            type="number"
            min="1"
            step="0.01"
            placeholder="50.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="bg-zinc-950 border-zinc-800 text-zinc-100 font-mono"
          />
        </div>
        <Button
          onClick={handleFund}
          disabled={loading}
          className="bg-green-500 hover:bg-green-600 text-black font-medium"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            "Fund Bounty"
          )}
        </Button>
      </div>
      {error && <p className="text-red-400 mt-3 text-sm">{error}</p>}
    </div>
  );
}