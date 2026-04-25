export function sanitizeRelativeRedirectPath(path: string | null | undefined): string {
  if (!path || !path.startsWith("/")) {
    return "/dashboard";
  }

  if (path.startsWith("//")) {
    return "/dashboard";
  }

  return path;
}
