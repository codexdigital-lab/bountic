export const bountyStatuses = ["OPEN", "LOCKED", "PAID"] as const;

export type BountyStatus = (typeof bountyStatuses)[number];

export const paymentStatuses = ["PENDING", "SUCCESS"] as const;

export type PaymentStatus = (typeof paymentStatuses)[number];

export type IssueRef = {
  owner: string;
  repo: string;
  issueNumber: number;
};

export type BountyRecord = {
  issueId: string;
  status: BountyStatus;
  totalAmount: number;
  ledgerCommentId: string | null;
};

export type FundingEventRecord = {
  id: string;
  issueId: string;
  funderUsername: string;
  amount: number;
  locusCheckoutId: string;
  paymentStatus: PaymentStatus;
};
