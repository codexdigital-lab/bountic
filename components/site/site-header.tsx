import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-900/80 bg-[#06090b]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2 text-zinc-100">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-400/90">
            <Image src="/logo.png" alt="Bountic" width={28} height={28} className="h-7 w-7 contrast-125" />
          </div>
          <span className="text-base font-semibold tracking-tight">Bountic</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-zinc-300 md:flex">
          <Link href="/" className="transition-colors hover:text-white">
            Home
          </Link>
          <Link href="/explore" className="transition-colors hover:text-white">
            Explore
          </Link>
        </nav>

        <Link href="/explore">
          <Button className="h-9 bg-emerald-400 text-black hover:bg-emerald-300">Browse Bounties</Button>
        </Link>
      </div>
    </header>
  );
}
