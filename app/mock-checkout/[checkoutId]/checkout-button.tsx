"use client";

import { Button } from "@/components/ui/button";
import { parseIssueId } from "@/lib/bounty/issue-id";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CheckoutButton({
    checkoutSessionId,
    issueId
}: {
    checkoutSessionId: string
    issueId: string
}) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await fetch("/api/webhooks/locus/mock", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ sessionId: checkoutSessionId }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to process mock webhook");
            } else {
                const successData = await response.json();
                setSuccess(true);
                const issueInfo = parseIssueId(issueId)!;
                setTimeout(() => {
                    router.replace(`/b/${issueInfo.owner}/${issueInfo.repo}/issues/${issueInfo.issueNumber}`);
                }, 2000);
            }
        } catch (e) {
            console.error("Error processing mock webhook:", e);
            setError(e instanceof Error ? e.message : "An unexpected error occurred");
            setTimeout(() => setError(null), 5000);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <form className="w-fit ml-auto" onSubmit={handleSubmit}>
            {error && <p className="text-red-500 mb-2">{error}</p>}
            <Button type="submit" disabled={isLoading || success}>
                {isLoading ? (
                    <span>Processing...</span>
                ) : success ? (
                    <span>Success! Redirecting...</span>
                ) : (
                    <span>Complete Payment</span>
                )}
            </Button>
        </form>
    )
}