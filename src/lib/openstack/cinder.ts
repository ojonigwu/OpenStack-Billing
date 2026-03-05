// Cinder (Block Storage) API client

export interface CinderVolume {
  id: string;
  name: string;
  status: string; // available, in-use, error, creating, deleting
  size: number; // GB
  volume_type: string;
  // for OS-specific extended attributes like os-vol-tenant-attr:tenant_id
  [key: string]: unknown;
  attachments: Array<{
    server_id: string;
    attachment_id: string;
    device: string;
  }>;
  created_at: string;
  updated_at: string;
  availability_zone: string;
  metadata: Record<string, string>;
}

export interface CinderVolumeType {
  id: string;
  name: string;
  description: string;
  is_public: boolean;
}

export async function listVolumes(
  cinderUrl: string,
  token: string,
  allTenants = true
): Promise<CinderVolume[]> {
  const url = allTenants
    ? `${cinderUrl}/volumes/detail?all_tenants=1`
    : `${cinderUrl}/volumes/detail`;

  const response = await fetch(url, {
    headers: { "X-Auth-Token": token },
  });

  if (!response.ok) {
    throw new Error(`Cinder list volumes failed: ${response.status}`);
  }

  const data = await response.json();
  return data.volumes || [];
}

export async function listVolumeTypes(
  cinderUrl: string,
  token: string
): Promise<CinderVolumeType[]> {
  const response = await fetch(`${cinderUrl}/types`, {
    headers: { "X-Auth-Token": token },
  });

  if (!response.ok) {
    throw new Error(`Cinder list volume types failed: ${response.status}`);
  }

  const data = await response.json();
  return data.volume_types || [];
}
