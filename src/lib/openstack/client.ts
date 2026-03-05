import { getOpenStackConfig } from "./config";
import { getToken, getEndpointUrl } from "./keystone";
import { listProjects } from "./keystone-admin";
import { listServers, listFlavors, getHypervisorStats } from "./nova";
import { listVolumes } from "./cinder";
import { listFloatingIPs, listNetworks, listRouters, listLoadBalancers } from "./neutron";

export interface OpenStackSummary {
  projects: Awaited<ReturnType<typeof listProjects>>;
  servers: Awaited<ReturnType<typeof listServers>>;
  flavors: Awaited<ReturnType<typeof listFlavors>>;
  volumes: Awaited<ReturnType<typeof listVolumes>>;
  floatingIPs: Awaited<ReturnType<typeof listFloatingIPs>>;
  networks: Awaited<ReturnType<typeof listNetworks>>;
  routers: Awaited<ReturnType<typeof listRouters>>;
  loadBalancers: Awaited<ReturnType<typeof listLoadBalancers>>;
  hypervisorStats: Awaited<ReturnType<typeof getHypervisorStats>>;
  region: string;
  authUrl: string;
}

export async function fetchOpenStackData(): Promise<OpenStackSummary> {
  const config = getOpenStackConfig();
  const tokenData = await getToken(config);
  const { token, catalog } = tokenData;
  const region = config.regionName;

  // Get service endpoints
  const novaUrl = getEndpointUrl(catalog, "compute", region) || "";
  const cinderUrl =
    getEndpointUrl(catalog, "volumev3", region) ||
    getEndpointUrl(catalog, "volumev2", region) ||
    getEndpointUrl(catalog, "volume", region) ||
    "";
  const neutronUrl = getEndpointUrl(catalog, "network", region) || "";

  // Fetch all data in parallel
  const [projects, servers, flavors, volumes, floatingIPs, networks, routers, loadBalancers, hypervisorStats] =
    await Promise.allSettled([
      listProjects(config.authUrl, token),
      novaUrl ? listServers(novaUrl, token, true) : Promise.resolve([]),
      novaUrl ? listFlavors(novaUrl, token) : Promise.resolve([]),
      cinderUrl ? listVolumes(cinderUrl, token, true) : Promise.resolve([]),
      neutronUrl ? listFloatingIPs(neutronUrl, token) : Promise.resolve([]),
      neutronUrl ? listNetworks(neutronUrl, token) : Promise.resolve([]),
      neutronUrl ? listRouters(neutronUrl, token) : Promise.resolve([]),
      neutronUrl ? listLoadBalancers(neutronUrl, token) : Promise.resolve([]),
      novaUrl ? getHypervisorStats(novaUrl, token) : Promise.resolve(null),
    ]);

  return {
    projects: projects.status === "fulfilled" ? projects.value : [],
    servers: servers.status === "fulfilled" ? servers.value : [],
    flavors: flavors.status === "fulfilled" ? flavors.value : [],
    volumes: volumes.status === "fulfilled" ? volumes.value : [],
    floatingIPs: floatingIPs.status === "fulfilled" ? floatingIPs.value : [],
    networks: networks.status === "fulfilled" ? networks.value : [],
    routers: routers.status === "fulfilled" ? routers.value : [],
    loadBalancers: loadBalancers.status === "fulfilled" ? loadBalancers.value : [],
    hypervisorStats: hypervisorStats.status === "fulfilled" ? hypervisorStats.value : null,
    region,
    authUrl: config.authUrl,
  };
}

export async function testConnection(): Promise<{ success: boolean; error?: string; projectName?: string }> {
  try {
    const config = getOpenStackConfig();
    const tokenData = await getToken(config);
    return { success: true, projectName: tokenData.projectName };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}
