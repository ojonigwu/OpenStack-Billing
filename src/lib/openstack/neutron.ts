// Neutron (Network) API client

export interface NeutronFloatingIP {
  id: string;
  floating_ip_address: string;
  fixed_ip_address: string | null;
  status: string; // ACTIVE, DOWN, ERROR
  tenant_id: string;
  port_id: string | null;
  router_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface NeutronNetwork {
  id: string;
  name: string;
  status: string;
  tenant_id: string;
  shared: boolean;
  external: boolean;
  subnets: string[];
  created_at: string;
}

export interface NeutronRouter {
  id: string;
  name: string;
  status: string;
  tenant_id: string;
  external_gateway_info: {
    network_id: string;
    enable_snat: boolean;
  } | null;
  created_at: string;
}

export interface NeutronLoadBalancer {
  id: string;
  name: string;
  description: string;
  operating_status: string;
  provisioning_status: string;
  tenant_id: string;
  vip_address: string;
  vip_network_id: string;
  created_at: string;
  updated_at: string;
}

export async function listFloatingIPs(
  neutronUrl: string,
  token: string
): Promise<NeutronFloatingIP[]> {
  const response = await fetch(`${neutronUrl}/v2.0/floatingips`, {
    headers: { "X-Auth-Token": token },
  });

  if (!response.ok) {
    throw new Error(`Neutron list floating IPs failed: ${response.status}`);
  }

  const data = await response.json();
  return data.floatingips || [];
}

export async function listNetworks(
  neutronUrl: string,
  token: string
): Promise<NeutronNetwork[]> {
  const response = await fetch(`${neutronUrl}/v2.0/networks`, {
    headers: { "X-Auth-Token": token },
  });

  if (!response.ok) {
    throw new Error(`Neutron list networks failed: ${response.status}`);
  }

  const data = await response.json();
  return data.networks || [];
}

export async function listRouters(
  neutronUrl: string,
  token: string
): Promise<NeutronRouter[]> {
  const response = await fetch(`${neutronUrl}/v2.0/routers`, {
    headers: { "X-Auth-Token": token },
  });

  if (!response.ok) {
    throw new Error(`Neutron list routers failed: ${response.status}`);
  }

  const data = await response.json();
  return data.routers || [];
}

export async function listLoadBalancers(
  neutronUrl: string,
  token: string
): Promise<NeutronLoadBalancer[]> {
  try {
    const response = await fetch(`${neutronUrl}/v2.0/lbaas/loadbalancers`, {
      headers: { "X-Auth-Token": token },
    });

    if (!response.ok) return [];

    const data = await response.json();
    return data.loadbalancers || [];
  } catch {
    return [];
  }
}
