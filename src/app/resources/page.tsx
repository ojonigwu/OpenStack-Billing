import { db } from "@/db";
import { resources, resourceTypes, projects } from "@/db/schema";
import { desc } from "drizzle-orm";
import Link from "next/link";

export default async function ResourcesPage() {
  const allResources = await db.select().from(resources).orderBy(desc(resources.createdAt));
  const resourceTypeList = await db.select().from(resourceTypes);
  const allProjects = await db.select().from(projects);

  const activeResources = allResources.filter((r) => r.status === "active");

  // Category breakdown
  const categoryStats: Record<string, { count: number; cost: number }> = {};
  for (const res of activeResources) {
    const rt = resourceTypeList.find((r) => r.id === res.resourceTypeId);
    if (rt) {
      if (!categoryStats[rt.category]) {
        categoryStats[rt.category] = { count: 0, cost: 0 };
      }
      categoryStats[rt.category].count++;
      // Estimate hourly cost
      categoryStats[rt.category].cost += rt.pricePerUnit * res.quantity;
    }
  }

  const categoryIcons: Record<string, string> = {
    compute: "🖥️",
    storage: "💾",
    network: "🌐",
    database: "🗄️",
  };

  const statusColor: Record<string, string> = {
    active: "text-green-400 bg-green-400/10",
    stopped: "text-yellow-400 bg-yellow-400/10",
    deleted: "text-red-400 bg-red-400/10",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Resources</h1>
        <p className="text-gray-400 mt-1">Monitor all OpenStack cloud resources and their costs</p>
      </div>

      {/* Category Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(categoryStats).map(([category, stats]) => (
          <div key={category} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">{categoryIcons[category] || "📦"}</span>
              <p className="text-gray-400 text-sm capitalize">{category}</p>
            </div>
            <p className="text-2xl font-bold text-white">{stats.count}</p>
            <p className="text-orange-400 text-sm mt-1">
              ${stats.cost.toFixed(4)}/hr
            </p>
          </div>
        ))}
      </div>

      {/* Resources Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">
            All Resources
            <span className="ml-2 text-sm text-gray-400 font-normal">
              ({activeResources.length} active / {allResources.length} total)
            </span>
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-6 py-3 text-gray-400 text-sm font-medium">Resource</th>
                <th className="text-left px-6 py-3 text-gray-400 text-sm font-medium">Project</th>
                <th className="text-left px-6 py-3 text-gray-400 text-sm font-medium">Type</th>
                <th className="text-left px-6 py-3 text-gray-400 text-sm font-medium">Category</th>
                <th className="text-left px-6 py-3 text-gray-400 text-sm font-medium">Region</th>
                <th className="text-right px-6 py-3 text-gray-400 text-sm font-medium">Quantity</th>
                <th className="text-right px-6 py-3 text-gray-400 text-sm font-medium">Hourly Cost</th>
                <th className="text-left px-6 py-3 text-gray-400 text-sm font-medium">Status</th>
                <th className="text-left px-6 py-3 text-gray-400 text-sm font-medium">Started</th>
              </tr>
            </thead>
            <tbody>
              {allResources.map((resource) => {
                const rt = resourceTypeList.find((r) => r.id === resource.resourceTypeId);
                const project = allProjects.find((p) => p.id === resource.projectId);
                const hourlyCost = rt ? rt.pricePerUnit * resource.quantity : 0;

                return (
                  <tr
                    key={resource.id}
                    className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors"
                  >
                    <td className="px-6 py-3">
                      <div>
                        <p className="text-white text-sm font-medium">{resource.name}</p>
                        <p className="text-gray-500 text-xs font-mono">{resource.instanceId}</p>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      {project ? (
                        <Link
                          href={`/projects/${project.id}`}
                          className="text-orange-400 hover:text-orange-300 text-sm"
                        >
                          {project.name}
                        </Link>
                      ) : (
                        <span className="text-gray-500 text-sm">—</span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-gray-300 text-sm">{rt?.name || "—"}</td>
                    <td className="px-6 py-3">
                      <span className="text-xs px-2 py-1 bg-gray-800 rounded text-gray-300 capitalize">
                        {rt?.category || "—"}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-gray-400 text-sm">{resource.region}</td>
                    <td className="px-6 py-3 text-right text-gray-300 text-sm">
                      {resource.quantity}
                      {rt && <span className="text-gray-500 ml-1 text-xs">{rt.unit.replace("-hour", "")}</span>}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <span className="text-orange-400 font-mono text-sm">
                        ${hourlyCost.toFixed(4)}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor[resource.status] || "text-gray-400 bg-gray-400/10"}`}>
                        {resource.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-gray-400 text-sm">
                      {resource.startedAt
                        ? new Date(resource.startedAt).toLocaleDateString()
                        : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
