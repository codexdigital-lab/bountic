"use client";

import { useMemo } from "react";

import { Button } from "@/components/ui/button";

type Props = {
  nextPath: string;
};

export function GithubLoginButton({ nextPath }: Props) {
  const loginHref = useMemo(() => {
    const params = new URLSearchParams({ next: nextPath });
    return `/api/auth/github?${params.toString()}`;
  }, [nextPath]);

  return (
    <Button
      className="mt-3 h-10 w-full border border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800"
      onClick={() => {
        window.location.href = loginHref;
      }}
    >
      Login with GitHub
    </Button>
  );
}
