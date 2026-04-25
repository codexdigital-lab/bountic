import "server-only";

import { App, Octokit } from "octokit";

import { getGithubServerEnv } from "@/lib/env/server";

let githubApp: App | undefined;

function normalizePrivateKey(value: string): string {
  if (value.includes("\\n")) {
    return value.replace(/\\n/g, "\n");
  }

  return value;
}

export function getGithubAppClient(): App {
  if (githubApp) {
    return githubApp;
  }

  const env = getGithubServerEnv();

  githubApp = new App({
    appId: env.GITHUB_APP_ID,
    privateKey: normalizePrivateKey(env.GITHUB_APP_PRIVATE_KEY),
    webhooks: {
      secret: env.GITHUB_WEBHOOK_SECRET,
    },
  });

  return githubApp;
}

export function getGithubTokenClient(token: string): Octokit {
  return new Octokit({ auth: token });
}

export async function getGithubInstallationClient(installationId: number): Promise<Octokit> {
  const app = getGithubAppClient();

  return app.getInstallationOctokit(installationId);
}

export async function getGithubRepoInstallationId(owner: string, repo: string): Promise<number> {
  const app = getGithubAppClient();
  const response = await app.octokit.rest.apps.getRepoInstallation({ owner, repo });

  return response.data.id;
}
