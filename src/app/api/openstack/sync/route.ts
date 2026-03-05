import { NextResponse } from "next/server";
import { fetchOpenStackData } from "@/lib/openstack/client";
import { isOpenStackConfigured } from "@/lib/openstack/config";
import { db } from "@/db";
import { projects, resources, resourceTypes } from "@/db/schema";
import { eq } from "drizzle-orm";

// Map OpenStack server status to our status
function mapServerStatus(osStatus: string): string {
  const statusMap: Record<string, string> = {
    ACTIVE: "active",
    SHUTOFF: "stopped",
    PAUSED: "stopped",
    SUSPENDED: "stopped",
    ERROR: "active", // still billing
    BUILD: "active",
    REBUILD: "active",
    RESIZE: "active",
    VERIFY_RESIZE: "active",
    DELETED: "deleted",
    SOFT_DELETED: "deleted",
  };
  return statusMap[osStatus] || "active";
}

function mapVolumeStatus(osStatus: string): string {
  const statusMap: Record<string, string> = {
    available: "active",
    "in-use": "active",
    error: "active",
    creating: "active",
    deleting: "deleted",
    deleted: "deleted",
  };
  return statusMap[osStatus] || "active";
}

export async function POST() {
  if (!isOpenStackConfigured()) {
    return NextResponse.json(
      { error: "OpenStack is not configured" },
      { status: 400 }
    );
  }

  try {
    const data = await fetchOpenStackData();

    // Ensure resource types exist
    const existingTypes = await db.select().from(resourceTypes);
    const typeMap = new Map(existingTypes.map((t) => [t.name, t]));

    // Sync projects from Keystone
    const existingProjects = await db.select().from(projects);
    const projectMap = new Map(existingProjects.map((p) => [p.tenantId, p]));

    let syncedProjects = 0;
    let syncedResources = 0;

    for (const osProject of data.projects) {
      if (!osProject.enabled) continue;

      if (!projectMap.has(osProject.id)) {
        // Insert new project
        const [newProject] = await db
          .insert(projects)
          .values({
            name: osProject.name,
            tenantId: osProject.id,
            description: osProject.description || null,
            status: "active",
            creditLimit: 1000.0,
            currentBalance: 0.0,
          })
          .returning();
        projectMap.set(osProject.id, newProject);
        syncedProjects++;
      }
    }

    // Sync servers (Nova)
    const existingResources = await db.select().from(resources);
    const resourceMap = new Map(existingResources.map((r) => [r.instanceId, r]));

    for (const server of data.servers) {
      const project = projectMap.get(server.tenant_id);
      if (!project) continue;

      // Find or create flavor resource type
      const flavor = data.flavors.find((f) => f.id === server.flavor?.id);
      const flavorName = flavor?.name || `flavor-${server.flavor?.id?.slice(0, 8) || "unknown"}`;

      let resourceType = typeMap.get(flavorName);
      if (!resourceType) {
        // Estimate price based on vCPUs
        const vcpus = flavor?.vcpus || 1;
        const pricePerUnit = vcpus * 0.04; // $0.04 per vCPU per hour

        const [newType] = await db
          .insert(resourceTypes)
          .values({
            name: flavorName,
            category: "compute",
            unit: "hour",
            pricePerUnit,
            description: flavor
              ? `${flavor.vcpus} vCPU, ${Math.round(flavor.ram / 1024)}GB RAM, ${flavor.disk}GB disk`
              : "Compute instance",
            isActive: true,
          })
          .returning();
        typeMap.set(flavorName, newType);
        resourceType = newType;
      }

      if (!resourceMap.has(server.id)) {
        await db.insert(resources).values({
          projectId: project.id,
          resourceTypeId: resourceType.id,
          instanceId: server.id,
          name: server.name,
          region: data.region,
          status: mapServerStatus(server.status),
          quantity: 1,
          startedAt: new Date(server.created),
        });
        syncedResources++;
      } else {
        // Update status
        await db
          .update(resources)
          .set({ status: mapServerStatus(server.status) })
          .where(eq(resources.instanceId, server.id));
      }
    }

    // Sync volumes (Cinder)
    for (const volume of data.volumes) {
      const tenantId = (volume["os-vol-tenant-attr:tenant_id"] as string | undefined) || (volume.tenant_id as string | undefined);
      const project = tenantId ? projectMap.get(tenantId) : undefined;
      if (!project) continue;

      const volumeTypeName = `volume.${volume.volume_type || "standard"}`;
      let resourceType = typeMap.get(volumeTypeName);

      if (!resourceType) {
        const [newType] = await db
          .insert(resourceTypes)
          .values({
            name: volumeTypeName,
            category: "storage",
            unit: "GB-hour",
            pricePerUnit: 0.0001,
            description: `Block Storage (${volume.volume_type || "standard"})`,
            isActive: true,
          })
          .returning();
        typeMap.set(volumeTypeName, newType);
        resourceType = newType;
      }

      if (!resourceMap.has(volume.id)) {
        await db.insert(resources).values({
          projectId: project.id,
          resourceTypeId: resourceType.id,
          instanceId: volume.id,
          name: volume.name || `volume-${volume.id.slice(0, 8)}`,
          region: data.region,
          status: mapVolumeStatus(volume.status),
          quantity: volume.size,
          startedAt: new Date(volume.created_at),
        });
        syncedResources++;
      } else {
        await db
          .update(resources)
          .set({ status: mapVolumeStatus(volume.status) })
          .where(eq(resources.instanceId, volume.id));
      }
    }

    // Sync floating IPs (Neutron)
    for (const fip of data.floatingIPs) {
      const project = projectMap.get(fip.tenant_id);
      if (!project) continue;

      const fipTypeName = "floating_ip";
      let resourceType = typeMap.get(fipTypeName);

      if (!resourceType) {
        const [newType] = await db
          .insert(resourceTypes)
          .values({
            name: fipTypeName,
            category: "network",
            unit: "hour",
            pricePerUnit: 0.005,
            description: "Floating IP Address",
            isActive: true,
          })
          .returning();
        typeMap.set(fipTypeName, newType);
        resourceType = newType;
      }

      if (!resourceMap.has(fip.id)) {
        await db.insert(resources).values({
          projectId: project.id,
          resourceTypeId: resourceType.id,
          instanceId: fip.id,
          name: fip.floating_ip_address,
          region: data.region,
          status: fip.status === "ACTIVE" ? "active" : "stopped",
          quantity: 1,
          startedAt: new Date(fip.created_at),
        });
        syncedResources++;
      }
    }

    // Sync load balancers
    for (const lb of data.loadBalancers) {
      const project = projectMap.get(lb.tenant_id);
      if (!project) continue;

      const lbTypeName = "load_balancer";
      let resourceType = typeMap.get(lbTypeName);

      if (!resourceType) {
        const [newType] = await db
          .insert(resourceTypes)
          .values({
            name: lbTypeName,
            category: "network",
            unit: "hour",
            pricePerUnit: 0.025,
            description: "Load Balancer (Octavia)",
            isActive: true,
          })
          .returning();
        typeMap.set(lbTypeName, newType);
        resourceType = newType;
      }

      if (!resourceMap.has(lb.id)) {
        await db.insert(resources).values({
          projectId: project.id,
          resourceTypeId: resourceType.id,
          instanceId: lb.id,
          name: lb.name || `lb-${lb.id.slice(0, 8)}`,
          region: data.region,
          status: lb.operating_status === "ONLINE" ? "active" : "stopped",
          quantity: 1,
          startedAt: new Date(lb.created_at),
        });
        syncedResources++;
      }
    }

    return NextResponse.json({
      success: true,
      syncedProjects,
      syncedResources,
      totals: {
        projects: data.projects.length,
        servers: data.servers.length,
        volumes: data.volumes.length,
        floatingIPs: data.floatingIPs.length,
        loadBalancers: data.loadBalancers.length,
      },
    });
  } catch (err) {
    console.error("OpenStack sync error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Sync failed" },
      { status: 500 }
    );
  }
}
