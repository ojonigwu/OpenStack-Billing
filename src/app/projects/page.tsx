import { db } from "@/db";
import { projects, resources, invoices } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";

export default async function ProjectsPage() {
  const allProjects = await db.select().from(projects).orderBy(desc(projects.createdAt));
  const allResources = await db.select().from(resources);
  const allInvoices = await db.select().from(invoices);

  const statusColor: Record<string, string> = {
    active: "text-green-400 bg-green-400/10 border-green-400/20",
    suspended: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
    deleted: "text-red-400 bg-red-400/10 border-red-400/20",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Projects</h1>
          <p className="text-gray-400 mt-1">Manage OpenStack tenant projects and billing</p>
        </div>
        <button className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors">
          + New Project
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-white">{allProjects.length}</p>
          <p className="text-gray-400 text-sm">Total Projects</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-green-400">
            {allProjects.filter((p) => p.status === "active").length}
          </p>
          <p className="text-gray-400 text-sm">Active</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-orange-400">
            ${allProjects.reduce((sum, p) => sum + p.currentBalance, 0).toFixed(2)}
          </p>
          <p className="text-gray-400 text-sm">Total Outstanding</p>
        </div>
      </div>

      {/* Projects Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">All Projects</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-6 py-3 text-gray-400 text-sm font-medium">Project</th>
                <th className="text-left px-6 py-3 text-gray-400 text-sm font-medium">Tenant ID</th>
                <th className="text-left px-6 py-3 text-gray-400 text-sm font-medium">Status</th>
                <th className="text-right px-6 py-3 text-gray-400 text-sm font-medium">Resources</th>
                <th className="text-right px-6 py-3 text-gray-400 text-sm font-medium">Balance</th>
                <th className="text-right px-6 py-3 text-gray-400 text-sm font-medium">Credit Limit</th>
                <th className="text-right px-6 py-3 text-gray-400 text-sm font-medium">Invoices</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {allProjects.map((project) => {
                const projectResources = allResources.filter(
                  (r) => r.projectId === project.id && r.status === "active"
                );
                const projectInvoices = allInvoices.filter((i) => i.projectId === project.id);
                const usagePercent = Math.min(
                  (project.currentBalance / project.creditLimit) * 100,
                  100
                );

                return (
                  <tr key={project.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-white font-medium">{project.name}</p>
                        {project.description && (
                          <p className="text-gray-500 text-xs mt-0.5">{project.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-orange-400 text-xs bg-orange-400/10 px-2 py-1 rounded">
                        {project.tenantId}
                      </code>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs px-2 py-1 rounded-full border font-medium ${statusColor[project.status] || "text-gray-400 bg-gray-400/10 border-gray-400/20"}`}
                      >
                        {project.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-white font-medium">{projectResources.length}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div>
                        <p className="text-white font-semibold">${project.currentBalance.toFixed(2)}</p>
                        <div className="mt-1 h-1 w-20 ml-auto bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${usagePercent > 80 ? "bg-red-500" : usagePercent > 60 ? "bg-yellow-500" : "bg-orange-500"}`}
                            style={{ width: `${usagePercent}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-gray-400">
                      ${project.creditLimit.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right text-gray-400">
                      {projectInvoices.length}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/projects/${project.id}`}
                        className="text-orange-400 hover:text-orange-300 text-sm"
                      >
                        View →
                      </Link>
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
