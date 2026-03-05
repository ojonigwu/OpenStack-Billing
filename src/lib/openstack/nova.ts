// Nova (Compute) API client

export interface NovaServer {
  id: string;
  name: string;
  status: string; // ACTIVE, SHUTOFF, ERROR, BUILD, etc.
  tenant_id: string;
  user_id: string;
  flavor: {
    id: string;
    vcpus?: number;
    ram?: number;
    disk?: number;
  };
  image: { id: string } | string;
  addresses: Record<string, Array<{ addr: string; version: number; "OS-EXT-IPS:type": string }>>;
  created: string;
  updated: string;
  "OS-EXT-AZ:availability_zone": string;
  metadata: Record<string, string>;
}

export interface NovaFlavor {
  id: string;
  name: string;
  vcpus: number;
  ram: number; // MB
  disk: number; // GB
  "os-flavor-access:is_public": boolean;
}

export interface NovaHypervisorStats {
  count: number;
  current_workload: number;
  disk_available_least: number;
  free_disk_gb: number;
  free_ram_mb: number;
  local_gb: number;
  local_gb_used: number;
  memory_mb: number;
  memory_mb_used: number;
  running_vms: number;
  vcpus: number;
  vcpus_used: number;
}

export async function listServers(
  novaUrl: string,
  token: string,
  allTenants = true
): Promise<NovaServer[]> {
  const url = allTenants
    ? `${novaUrl}/servers/detail?all_tenants=1`
    : `${novaUrl}/servers/detail`;

  const response = await fetch(url, {
    headers: { "X-Auth-Token": token },
  });

  if (!response.ok) {
    throw new Error(`Nova list servers failed: ${response.status}`);
  }

  const data = await response.json();
  return data.servers || [];
}

export async function listFlavors(novaUrl: string, token: string): Promise<NovaFlavor[]> {
  const response = await fetch(`${novaUrl}/flavors/detail`, {
    headers: { "X-Auth-Token": token },
  });

  if (!response.ok) {
    throw new Error(`Nova list flavors failed: ${response.status}`);
  }

  const data = await response.json();
  return data.flavors || [];
}

export async function getHypervisorStats(
  novaUrl: string,
  token: string
): Promise<NovaHypervisorStats | null> {
  try {
    const response = await fetch(`${novaUrl}/os-hypervisors/statistics`, {
      headers: { "X-Auth-Token": token },
    });

    if (!response.ok) return null;

    const data = await response.json();
    return data.hypervisor_statistics || null;
  } catch {
    return null;
  }
}
