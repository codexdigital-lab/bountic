"use client";

import Link from "next/link";
import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const markdownComponents: Components = {
  p: ({ children }) => <p className="mb-3 leading-relaxed text-zinc-300">{children}</p>,
  a: ({ href, children }) => (
    <Link
      href={href!}
      target="_blank"
      rel="noopener noreferrer"
      className="text-emerald-300 underline underline-offset-4 hover:text-emerald-200"
    >
      {children}
    </Link>
  ),
  code: ({ children, className }) => {
    const inline = !className;

    if (inline) {
      return <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-200">{children}</code>;
    }

    return <code className="block overflow-x-auto rounded-lg bg-zinc-950 p-3 text-xs text-zinc-200">{children}</code>;
  },
  pre: ({ children }) => <pre className="mb-3 overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950 p-3">{children}</pre>,
  ul: ({ children }) => <ul className="mb-3 list-disc space-y-1 pl-5 text-zinc-300">{children}</ul>,
  ol: ({ children }) => <ol className="mb-3 list-decimal space-y-1 pl-5 text-zinc-300">{children}</ol>,
  li: ({ children }) => <li>{children}</li>,
  blockquote: ({ children }) => <blockquote className="mb-3 border-l-2 border-zinc-700 pl-3 text-zinc-400">{children}</blockquote>,
  h1: ({ children }) => <h1 className="mb-3 text-xl font-semibold text-zinc-100">{children}</h1>,
  h2: ({ children }) => <h2 className="mb-3 text-lg font-semibold text-zinc-100">{children}</h2>,
  h3: ({ children }) => <h3 className="mb-2 text-base font-semibold text-zinc-100">{children}</h3>,
  hr: () => <hr className="my-4 border-zinc-800" />,
};

export function IssueMarkdown({ content }: { content: string }) {
  return (
    <div className="scrollbar-thin-dark prose prose-invert max-h-80 overflow-y-auto pr-2">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
