"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const statusOptions = [
  { value: "all", label: "All Status" },
  { value: "OPEN", label: "Open" },
  { value: "LOCKED", label: "Locked" },
  { value: "PAID", label: "Paid" },
];

const sortOptions = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "amount_desc", label: "Highest Amount" },
  { value: "amount_asc", label: "Lowest Amount" },
];

export function FilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentStatus = searchParams.get("status") || "all";
  const currentSort = searchParams.get("sort") || "newest";

  const updateParams = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === "all" || value === "newest") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      router.push(`/explore?${params.toString()}`);
    },
    [router, searchParams]
  );

  return (
    <div className="flex flex-wrap gap-4 items-center mb-8">
      <Select value={currentStatus as string} onValueChange={(v) => v && updateParams("status", v)}>
        <SelectTrigger className="w-[160px] bg-zinc-900 border-zinc-800 text-zinc-300">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent className="bg-zinc-900 border-zinc-800">
          {statusOptions.map((opt) => (
            <SelectItem
              key={opt.value}
              value={opt.value}
              className="text-zinc-300 focus:bg-zinc-800 focus:text-zinc-100"
            >
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={currentSort as string} onValueChange={(v) => v && updateParams("sort", v)}>
        <SelectTrigger className="w-[180px] bg-zinc-900 border-zinc-800 text-zinc-300">
          <SelectValue placeholder="Sort" />
        </SelectTrigger>
        <SelectContent className="bg-zinc-900 border-zinc-800">
          {sortOptions.map((opt) => (
            <SelectItem
              key={opt.value}
              value={opt.value}
              className="text-zinc-300 focus:bg-zinc-800 focus:text-zinc-100"
            >
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push("/explore")}
        className="text-zinc-500 hover:text-zinc-300"
      >
        Clear filters
      </Button>
    </div>
  );
}