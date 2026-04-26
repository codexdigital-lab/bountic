import { z } from "zod";

export const githubIssueCommentPayloadSchema = z.object({
  action: z.literal("created"),
  installation: z
    .object({
      id: z.number().int().positive(),
    })
    .optional(),
  repository: z.object({
    name: z.string().min(1),
    owner: z.object({
      login: z.string().min(1),
    }),
  }),
  issue: z.object({
    number: z.number().int().positive(),
    pull_request: z.unknown().optional(),
    html_url: z.string().url().optional(),
  }),
  comment: z.object({
    id: z.number().int().positive(),
    body: z.string(),
    user: z.object({
      login: z.string().min(1),
    }),
  }),
});

export const githubIssueLabeledPayloadSchema = z.object({
  action: z.literal("labeled"),
  installation: z
    .object({
      id: z.number().int().positive(),
    })
    .optional(),
  repository: z.object({
    name: z.string().min(1),
    owner: z.object({
      login: z.string().min(1),
    }),
  }),
  issue: z.object({
    number: z.number().int().positive(),
    title: z.string().min(1),
    body: z.string().nullable(),
    state: z.string().min(1),
    html_url: z.string().url(),
    pull_request: z.unknown().optional(),
    labels: z.array(
      z.union([
        z.string(),
        z.object({
          name: z.string().min(1),
        }),
      ]),
    ),
  }),
  label: z.union([
    z.string(),
    z.object({
      name: z.string().min(1),
    }),
  ]),
});

export const locusWebhookSchema = z.object({
  event: z.string(),
  data: z.record(z.string(), z.unknown()),
});

export const prOpenedPayloadSchema = z.object({
  action: z.literal("opened"),
  installation: z
    .object({
      id: z.number().int().positive(),
    })
    .optional(),
  repository: z.object({
    name: z.string().min(1),
    owner: z.object({
      login: z.string().min(1),
    }),
  }),
  pull_request: z.object({
    number: z.number().int().positive(),
    user: z.object({
      login: z.string().min(1),
    }),
    body: z.string().nullable(),
    merged: z.boolean().optional(),
    html_url: z.string().url().optional(),
  }),
});

export const prClosedPayloadSchema = z.object({
  action: z.literal("closed"),
  installation: z
    .object({
      id: z.number().int().positive(),
    })
    .optional(),
  repository: z.object({
    name: z.string().min(1),
    owner: z.object({
      login: z.string().min(1),
    }),
  }),
  pull_request: z.object({
    number: z.number().int().positive(),
    user: z.object({
      login: z.string().min(1),
    }),
    body: z.string().nullable(),
    merged: z.boolean().optional(),
    html_url: z.string().url().optional(),
    title: z.string().optional(),
  }),
});

export const prCommentPayloadSchema = z.object({
  action: z.literal("created"),
  installation: z
    .object({
      id: z.number().int().positive(),
    })
    .optional(),
  repository: z.object({
    name: z.string().min(1),
    owner: z.object({
      login: z.string().min(1),
    }),
  }),
  issue: z.object({
    number: z.number().int().positive(),
    pull_request: z.object({
      url: z.string().url().optional(),
      user: z.object({
        login: z.string().min(1),
      }).optional(),
    }).optional(),
  }),
  comment: z.object({
    id: z.number().int().positive(),
    body: z.string(),
    user: z.object({
      login: z.string().min(1),
    }),
  }),
});

export type CheckoutSession = {
  id: string;
  checkoutUrl: string;
  webhookSecret: string | null;
};
