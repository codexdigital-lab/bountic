export function sanitizeRelativeRedirectPath(path: string | null | undefined): string {
  if (!path || !path.startsWith("/")) {
    return "/connect";
  }

  if (path.startsWith("//")) {
    return "/connect";
  }

  return path;
}
