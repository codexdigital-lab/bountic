import "server-only";

import crypto from "node:crypto";

import { getLocusServerEnv } from "@/lib/env/server";

type LocusSuccess<T> = {
  success: true;
  data: T;
};

type LocusFailure = {
  success: false;
  error?: string;
  message?: string;
};

type LocusEnvelope<T> = LocusSuccess<T> | LocusFailure;

function getLocusErrorMessage<T>(payload: LocusEnvelope<T>): string {
  if (payload.success) {
    return "Locus request failed";
  }

  return payload.message ?? "Locus request failed";
}

function getLocusErrorCode<T>(payload: LocusEnvelope<T>): string | undefined {
  if (payload.success) {
    return undefined;
  }

  return payload.error;
}

export class LocusApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "LocusApiError";
  }
}

export type LocusRequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: HeadersInit;
};

export type LocusClient = {
  request<T>(path: string, options?: LocusRequestOptions): Promise<T>;
  verifyWebhookSignature(payload: string, signature: string): boolean;
};

let locusClient: LocusClient | undefined;

function getAbsoluteUrl(path: string): string {
  const env = getLocusServerEnv();
  const baseUrl = env.LOCUS_API_BASE_URL.replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${baseUrl}${normalizedPath}`;
}

export function getLocusServerClient(): LocusClient {
  if (locusClient) {
    return locusClient;
  }

  const env = getLocusServerEnv();

  locusClient = {
    async request<T>(path: string, options: LocusRequestOptions = {}): Promise<T> {
      const response = await fetch(getAbsoluteUrl(path), {
        method: options.method ?? "GET",
        headers: {
          Authorization: `Bearer ${env.LOCUS_API_KEY}`,
          "Content-Type": "application/json",
          ...options.headers,
        },
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
      });

      const payload = (await response.json()) as LocusEnvelope<T>;

      if (!response.ok || !payload.success) {
        throw new LocusApiError(
          getLocusErrorMessage(payload),
          response.status,
          getLocusErrorCode(payload),
        );
      }

      return payload.data;
    },

    verifyWebhookSignature(payload: string, signature: string): boolean {
      const env = getLocusServerEnv();

      if (!env.LOCUS_WEBHOOK_SECRET) {
        return false;
      }

      const expected =
        "sha256=" +
        crypto.createHmac("sha256", env.LOCUS_WEBHOOK_SECRET).update(payload).digest("hex");

      const provided = signature.trim();

      if (provided.length !== expected.length) {
        return false;
      }

      return crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
    },
  };

  return locusClient;
}
