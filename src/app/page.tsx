import { db } from "@/db";
import { projects, invoices, resources, resourceTypes } from "@/db/schema";
import { desc } from "drizzle-orm";
import { seedDatabase } from "@/lib/seed";
import { isOpenStackConfigured } from "@/lib/openstack/config";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  await seedDatabase();
  const osConfigured = isOpenStackConfigured();

  // Fetch summary stats
  const allProjects = await db.select().from(projects);
  const allInvoices = await db.select().from(invoices).orderBy(desc(invoices.createdAt)).limit(5);
  const allResources = await db.select().from(resources);

  const totalRevenue = allInvoices
    .filter((i) => i.status === "paid")
    .reduce((sum, i) => sum + i.total, 0);

  const pendingAmount = allInvoices
    .filter((i) => i.status === "pending" || i.status === "overdue")
    .reduce((sum, i) => sum + i.total, 0);

  const activeResources = allResources.filter((r) => r.status === "active").length;
  const overdueInvoices = allInvoices.filter((i) => i.status === "overdue").length;

  // Resource breakdown by category
  const resourceTypeList = await db.select().from(resourceTypes);
  const categoryCount: Record<string, number> = {};
  for (const res of allResources.filter((r) => r.status === "active")) {
    const rt = resourceTypeList.find((rt) => rt.id === res.resourceTypeId);
    if (rt) {
      categoryCount[rt.category] = (categoryCount[rt.category] || 0) + 1;
    }
  }

  const statusColor: Record<string, string> = {
    paid: "text-green-400 bg-green-400/10",
    pending: "text-yellow-400 bg-yellow-400/10",
    overdue: "text-red-400 bg-red-400/10",
    cancelled: "text-gray-400 bg-gray-400/10",
  };

  const projectStatusColor: Record<string, string> = {
    active: "text-green-400 bg-green-400/10",
    suspended: "text-yellow-400 bg-yellow-400/10",
    deleted: "text-red-400 bg-red-400/10",
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Billing Dashboard</h1>
        <p className="text-gray-400 mt-1">Overview of your OpenStack cloud resource billing</p>
      </div>

      {/* OpenStack Connection Banner */}
      {osConfigured ? (
        <div className="flex items-center gap-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
          <span className="text-green-400">🔗</span>
          <p className="text-green-400 text-sm font-medium">
            Connected to OpenStack Kolla environment
          </p>
          <Link href="/settings" className="ml-auto text-green-400 hover:text-green-300 text-sm">
            Sync data →
          </Link>
        </div>
      ) : (
        <div className="flex items-center gap-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <span className="text-yellow-400">⚠️</span>
          <p className="text-yellow-400 text-sm">
            OpenStack not connected — showing demo data.
          </p>
          <Link href="/settings" className="ml-auto text-orange-400 hover:text-orange-300 text-sm">
            Configure →
          </Link>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={`$${totalRevenue.toFixed(2)}`}
          subtitle="From paid invoices"
          icon="💵"
          color="green"
        />
        <StatCard
          title="Pending Payments"
          value={`$${pendingAmount.toFixed(2)}`}
          subtitle={`${overdueInvoices} overdue`}
          icon="⏳"
          color={overdueInvoices > 0 ? "red" : "yellow"}
        />
        <StatCard
          title="Active Projects"
          value={allProjects.filter((p) => p.status === "active").length.toString()}
          subtitle={`${allProjects.length} total`}
          icon="🏗️"
          color="blue"
        />
        <StatCard
          title="Active Resources"
          value={activeResources.toString()}
          subtitle="Running instances"
          icon="⚙️"
          color="purple"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Invoices */}
        <div className="lg:col-span-2 bg-gray-900 rounded-xl border border-gray-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Recent Invoices</h2>
            <Link href="/invoices" className="text-orange-400 hover:text-orange-300 text-sm">
              View all →
            </Link>
          </div>
          <div className="space-y-3">
            {allInvoices.map((invoice) => {
              const project = allProjects.find((p) => p.id === invoice.projectId);
              return (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-3 bg-gray-800 rounded-lg"
                >
                  <div>
                    <p className="text-white font-medium text-sm">{invoice.invoiceNumber}</p>
                    <p className="text-gray-400 text-xs">{project?.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-semibold">${invoice.total.toFixed(2)}</p>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[invoice.status] || "text-gray-400 bg-gray-400/10"}`}
                    >
                      {invoice.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Projects Summary */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Projects</h2>
            <Link href="/projects" className="text-orange-400 hover:text-orange-300 text-sm">
              View all →
            </Link>
          </div>
          <div className="space-y-3">
            {allProjects.map((project) => (
              <div key={project.id} className="p-3 bg-gray-800 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-white font-medium text-sm truncate">{project.name}</p>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${projectStatusColor[project.status] || "text-gray-400 bg-gray-400/10"}`}
                  >
                    {project.status}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-gray-400 text-xs">Balance</p>
                  <p className="text-orange-400 text-sm font-semibold">
                    ${project.currentBalance.toFixed(2)}
                  </p>
                </div>
                {/* Credit usage bar */}
                <div className="mt-2 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-500 rounded-full"
                    style={{
                      width: `${Math.min((project.currentBalance / project.creditLimit) * 100, 100)}%`,
                    }}
                  />
                </div>
                <p className="text-gray-500 text-xs mt-1">
                  ${project.currentBalance.toFixed(0)} / ${project.creditLimit.toFixed(0)} limit
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Resource Categories */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Resource Distribution</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Object.entries(categoryCount).map(([category, count]) => {
            const icons: Record<string, string> = {
              compute: "🖥️",
              storage: "💾",
              network: "🌐",
              database: "🗄️",
            };
            const colors: Record<string, string> = {
              compute: "border-blue-500/30 bg-blue-500/5",
              storage: "border-purple-500/30 bg-purple-500/5",
              network: "border-green-500/30 bg-green-500/5",
              database: "border-yellow-500/30 bg-yellow-500/5",
            };
            return (
              <div
                key={category}
                className={`p-4 rounded-lg border ${colors[category] || "border-gray-700 bg-gray-800"}`}
              >
                <div className="text-2xl mb-2">{icons[category] || "📦"}</div>
                <p className="text-2xl font-bold text-white">{count}</p>
                <p className="text-gray-400 text-sm capitalize">{category}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
  color,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: string;
  color: "green" | "red" | "yellow" | "blue" | "purple";
}) {
  const colorMap = {
    green: "border-green-500/30 bg-green-500/5",
    red: "border-red-500/30 bg-red-500/5",
    yellow: "border-yellow-500/30 bg-yellow-500/5",
    blue: "border-blue-500/30 bg-blue-500/5",
    purple: "border-purple-500/30 bg-purple-500/5",
  };

  return (
    <div className={`bg-gray-900 rounded-xl border p-6 ${colorMap[color]}`}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-gray-400 text-sm">{title}</p>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-gray-500 text-sm mt-1">{subtitle}</p>
    </div>
  );
}
