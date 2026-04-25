export function formatAmount(amount: number): string {
  return amount.toFixed(2);
}

export function getStatusColor(status: "OPEN" | "LOCKED" | "PAID"): string {
  switch (status) {
    case "OPEN":
      return "border-green-500/50 text-green-400 bg-green-500/10";
    case "LOCKED":
      return "border-yellow-500/50 text-yellow-400 bg-yellow-500/10";
    case "PAID":
      return "border-zinc-500 text-zinc-400 bg-zinc-500/10";
    default:
      return "";
  }
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}