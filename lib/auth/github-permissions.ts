import "server-only";

import { getSupabaseServerClient } from "@/lib/clients/supabase/server";
import { getGithubTokenClient } from "@/lib/clients/github/server";

type RepoPermission = "admin" | "maintain" | "write" | "triage" | "read" | "none";

export type ViewerRepoPermission = {
  isAuthenticated: boolean;
  githubUsername: string | null;
  permission: RepoPermission | null;
  canApprovePayment: boolean;
};

function canApproveFromPermission(permission: RepoPermission | null): boolean {
  return permission === "admin" || permission === "maintain" || permission === "write";
}

export async function getViewerRepoPermission(owner: string, repo: string): Promise<ViewerRepoPermission> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.provider_token) {
    return {
      isAuthenticated: false,
      githubUsername: null,
      permission: null,
      canApprovePayment: false,
    };
  }

  const github = getGithubTokenClient(session.provider_token);

  try {
    const viewer = await github.rest.users.getAuthenticated();
    const permissionResponse = await github.rest.repos.getCollaboratorPermissionLevel({
      owner,
      repo,
      username: viewer.data.login,
    });

    const permission = permissionResponse.data.permission as RepoPermission;

    return {
      isAuthenticated: true,
      githubUsername: viewer.data.login,
      permission,
      canApprovePayment: canApproveFromPermission(permission),
    };
  } catch {
    return {
      isAuthenticated: true,
      githubUsername: null,
      permission: null,
      canApprovePayment: false,
    };
  }
}
