import "server-only";

import { z } from "zod";

const supabaseServerEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1).optional(),
  SUPABASE_SERVICE_KEY: z.string().min(1),
});

const githubServerEnvSchema = z.object({
  GITHUB_APP_ID: z.coerce.number().int().positive(),
  GITHUB_APP_PRIVATE_KEY: z.string().min(1),
  GITHUB_WEBHOOK_SECRET: z.string().min(1),
});

const locusServerEnvSchema = z.object({
  LOCUS_API_KEY: z.string().min(1),
  LOCUS_API_BASE_URL: z.string().url().default("https://beta-api.paywithlocus.com/api"),
  LOCUS_WEBHOOK_SECRET: z.string().min(1).optional(),
});

export type SupabaseServerEnv = z.infer<typeof supabaseServerEnvSchema>;
export type GithubServerEnv = z.infer<typeof githubServerEnvSchema>;
export type LocusServerEnv = z.infer<typeof locusServerEnvSchema>;

let cachedSupabaseServerEnv: SupabaseServerEnv | undefined;
let cachedGithubServerEnv: GithubServerEnv | undefined;
let cachedLocusServerEnv: LocusServerEnv | undefined;

export function getSupabaseServerEnv(): SupabaseServerEnv {
  if (cachedSupabaseServerEnv) {
    return cachedSupabaseServerEnv;
  }

  cachedSupabaseServerEnv = supabaseServerEnvSchema.parse({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY,
  });

  return cachedSupabaseServerEnv;
}

export function getGithubServerEnv(): GithubServerEnv {
  if (cachedGithubServerEnv) {
    return cachedGithubServerEnv;
  }

  cachedGithubServerEnv = githubServerEnvSchema.parse({
    GITHUB_APP_ID: process.env.GITHUB_APP_ID,
    GITHUB_APP_PRIVATE_KEY: process.env.GITHUB_APP_PRIVATE_KEY,
    GITHUB_WEBHOOK_SECRET: process.env.GITHUB_WEBHOOK_SECRET,
  });

  return cachedGithubServerEnv;
}

export function getLocusServerEnv(): LocusServerEnv {
  if (cachedLocusServerEnv) {
    return cachedLocusServerEnv;
  }

  cachedLocusServerEnv = locusServerEnvSchema.parse({
    LOCUS_API_KEY: process.env.LOCUS_API_KEY,
    LOCUS_API_BASE_URL: process.env.LOCUS_API_BASE_URL,
    LOCUS_WEBHOOK_SECRET: process.env.LOCUS_WEBHOOK_SECRET,
  });

  return cachedLocusServerEnv;
}
