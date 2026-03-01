import { db } from "@/db";
import { projects, resources, resourceTypes, invoices, payments } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const projectId = parseInt(id);

  const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
  if (!project) notFound();

  const projectResources = await db
    .select()
    .from(resources)
    .where(eq(resources.projectId, projectId));

  const resourceTypeList = await db.select().from(resourceTypes);
  const projectInvoices = await db
    .select()
    .from(invoices)
    .where(eq(invoices.projectId, projectId))
    .orderBy(desc(invoices.createdAt));

  const projectPayments = await db
    .select()
    .from(payments)
    .where(eq(payments.projectId, projectId))
    .orderBy(desc(payments.createdAt));

  const activeResources = projectResources.filter((r) => r.status === "active");
  const totalPaid = projectPayments
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + p.amount, 0);

  const statusColor: Record<string, string> = {
    paid: "text-green-400 bg-green-400/10",
    pending: "text-yellow-400 bg-yellow-400/10",
    overdue: "text-red-400 bg-red-400/10",
    cancelled: "text-gray-400 bg-gray-400/10",
  };

  const resourceStatusColor: Record<string, string> = {
    active: "text-green-400",
    stopped: "text-yellow-400",
    deleted: "text-red-400",
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <Link href="/projects" className="hover:text-orange-400">Projects</Link>
        <span>/</span>
        <span className="text-white">{project.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">{project.name}</h1>
          {project.description && (
            <p className="text-gray-400 mt-1">{project.description}</p>
          )}
          <code className="text-orange-400 text-sm bg-orange-400/10 px-2 py-1 rounded mt-2 inline-block">
            {project.tenantId}
          </code>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            project.status === "active"
              ? "text-green-400 bg-green-400/10"
              : "text-red-400 bg-red-400/10"
          }`}
        >
          {project.status}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-gray-400 text-sm">Current Balance</p>
          <p className="text-2xl font-bold text-orange-400 mt-1">
            ${project.currentBalance.toFixed(2)}
          </p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-gray-400 text-sm">Credit Limit</p>
          <p className="text-2xl font-bold text-white mt-1">
            ${project.creditLimit.toFixed(2)}
          </p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-gray-400 text-sm">Active Resources</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{activeResources.length}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-gray-400 text-sm">Total Paid</p>
          <p className="text-2xl font-bold text-green-400 mt-1">${totalPaid.toFixed(2)}</p>
        </div>
      </div>

      {/* Credit Usage Bar */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-white font-medium">Credit Usage</p>
          <p className="text-gray-400 text-sm">
            ${project.currentBalance.toFixed(2)} / ${project.creditLimit.toFixed(2)}
          </p>
        </div>
        <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-orange-500 rounded-full transition-all"
            style={{
              width: `${Math.min((project.currentBalance / project.creditLimit) * 100, 100)}%`,
            }}
          />
        </div>
        <p className="text-gray-500 text-sm mt-1">
          {((project.currentBalance / project.creditLimit) * 100).toFixed(1)}% used
        </p>
      </div>

      {/* Resources */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">Resources ({projectResources.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-6 py-3 text-gray-400 text-sm font-medium">Name</th>
                <th className="text-left px-6 py-3 text-gray-400 text-sm font-medium">Type</th>
                <th className="text-left px-6 py-3 text-gray-400 text-sm font-medium">Category</th>
                <th className="text-left px-6 py-3 text-gray-400 text-sm font-medium">Region</th>
                <th className="text-right px-6 py-3 text-gray-400 text-sm font-medium">Quantity</th>
                <th className="text-left px-6 py-3 text-gray-400 text-sm font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {projectResources.map((resource) => {
                const rt = resourceTypeList.find((r) => r.id === resource.resourceTypeId);
                return (
                  <tr key={resource.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                    <td className="px-6 py-3">
                      <div>
                        <p className="text-white text-sm font-medium">{resource.name}</p>
                        <p className="text-gray-500 text-xs">{resource.instanceId}</p>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-gray-300 text-sm">{rt?.name || "—"}</td>
                    <td className="px-6 py-3">
                      <span className="text-xs px-2 py-1 bg-gray-800 rounded text-gray-300 capitalize">
                        {rt?.category || "—"}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-gray-400 text-sm">{resource.region}</td>
                    <td className="px-6 py-3 text-right text-gray-300 text-sm">
                      {resource.quantity} {rt?.unit?.replace("-hour", "") || ""}
                    </td>
                    <td className="px-6 py-3">
                      <span className={`text-sm font-medium ${resourceStatusColor[resource.status] || "text-gray-400"}`}>
                        ● {resource.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoices */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">Invoices</h2>
        </div>
        <div className="divide-y divide-gray-800">
          {projectInvoices.length === 0 ? (
            <p className="px-6 py-4 text-gray-500">No invoices yet</p>
          ) : (
            projectInvoices.map((invoice) => (
              <div key={invoice.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-800/30">
                <div>
                  <p className="text-white font-medium">{invoice.invoiceNumber}</p>
                  <p className="text-gray-500 text-sm">
                    {new Date(invoice.periodStart).toLocaleDateString()} –{" "}
                    {new Date(invoice.periodEnd).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-white font-semibold">${invoice.total.toFixed(2)}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor[invoice.status]}`}>
                    {invoice.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
