// Keystone Admin API - for listing all projects/tenants

export interface KeystoneProject {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  domain_id: string;
  parent_id: string | null;
}

export interface KeystoneUser {
  id: string;
  name: string;
  email: string;
  enabled: boolean;
  domain_id: string;
}

export async function listProjects(
  keystoneUrl: string,
  token: string
): Promise<KeystoneProject[]> {
  const authUrl = keystoneUrl.replace(/\/$/, "");
  const response = await fetch(`${authUrl}/v3/projects`, {
    headers: { "X-Auth-Token": token },
  });

  if (!response.ok) {
    throw new Error(`Keystone list projects failed: ${response.status}`);
  }

  const data = await response.json();
  return data.projects || [];
}

export async function listUsers(
  keystoneUrl: string,
  token: string
): Promise<KeystoneUser[]> {
  const authUrl = keystoneUrl.replace(/\/$/, "");
  const response = await fetch(`${authUrl}/v3/users`, {
    headers: { "X-Auth-Token": token },
  });

  if (!response.ok) {
    throw new Error(`Keystone list users failed: ${response.status}`);
  }

  const data = await response.json();
  return data.users || [];
}
