import type { OpenStackConfig } from "./config";

export interface KeystoneToken {
  token: string;
  expiresAt: string;
  catalog: ServiceCatalogEntry[];
  projectId: string;
  projectName: string;
}

export interface ServiceCatalogEntry {
  type: string;
  name: string;
  endpoints: ServiceEndpoint[];
}

export interface ServiceEndpoint {
  interface: "public" | "internal" | "admin";
  region: string;
  url: string;
}

// Simple in-memory token cache
let cachedToken: KeystoneToken | null = null;

export async function getToken(config: OpenStackConfig): Promise<KeystoneToken> {
  // Return cached token if still valid (with 5 min buffer)
  if (cachedToken) {
    const expiresAt = new Date(cachedToken.expiresAt).getTime();
    const now = Date.now();
    if (expiresAt - now > 5 * 60 * 1000) {
      return cachedToken;
    }
  }

  const authUrl = config.authUrl.replace(/\/$/, "");
  const response = await fetch(`${authUrl}/v3/auth/tokens`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      auth: {
        identity: {
          methods: ["password"],
          password: {
            user: {
              name: config.username,
              domain: { name: config.userDomainName },
              password: config.password,
            },
          },
        },
        scope: {
          project: {
            name: config.projectName,
            domain: { name: config.projectDomainName },
          },
        },
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Keystone authentication failed: ${response.status} ${body}`);
  }

  const token = response.headers.get("X-Subject-Token");
  if (!token) {
    throw new Error("No X-Subject-Token in Keystone response");
  }

  const data = await response.json();
  const tokenData = data.token;

  cachedToken = {
    token,
    expiresAt: tokenData.expires_at,
    catalog: tokenData.catalog || [],
    projectId: tokenData.project?.id || "",
    projectName: tokenData.project?.name || "",
  };

  return cachedToken;
}

export function getEndpointUrl(
  catalog: ServiceCatalogEntry[],
  serviceType: string,
  region: string,
  interfaceType: "public" | "internal" | "admin" = "public"
): string | null {
  const service = catalog.find((s) => s.type === serviceType);
  if (!service) return null;

  const endpoint = service.endpoints.find(
    (e) => e.interface === interfaceType && e.region === region
  );

  return endpoint?.url || null;
}

export function invalidateToken() {
  cachedToken = null;
}
