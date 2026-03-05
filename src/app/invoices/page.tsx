import { db } from "@/db";
import { invoices, projects, payments } from "@/db/schema";
import { desc } from "drizzle-orm";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function InvoicesPage() {
  const allInvoices = await db.select().from(invoices).orderBy(desc(invoices.createdAt));
  const allProjects = await db.select().from(projects);
  const allPayments = await db.select().from(payments);

  const totalRevenue = allInvoices
    .filter((i) => i.status === "paid")
    .reduce((sum, i) => sum + i.total, 0);

  const pendingTotal = allInvoices
    .filter((i) => i.status === "pending")
    .reduce((sum, i) => sum + i.total, 0);

  const overdueTotal = allInvoices
    .filter((i) => i.status === "overdue")
    .reduce((sum, i) => sum + i.total, 0);

  const statusColor: Record<string, string> = {
    paid: "text-green-400 bg-green-400/10 border-green-400/20",
    pending: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
    overdue: "text-red-400 bg-red-400/10 border-red-400/20",
    cancelled: "text-gray-400 bg-gray-400/10 border-gray-400/20",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Invoices</h1>
          <p className="text-gray-400 mt-1">Billing history and payment tracking</p>
        </div>
        <button className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors">
          + Generate Invoice
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gray-900 border border-green-500/20 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-green-400">✓</span>
            <p className="text-gray-400 text-sm">Total Collected</p>
          </div>
          <p className="text-2xl font-bold text-green-400">${totalRevenue.toFixed(2)}</p>
          <p className="text-gray-500 text-sm mt-1">
            {allInvoices.filter((i) => i.status === "paid").length} paid invoices
          </p>
        </div>
        <div className="bg-gray-900 border border-yellow-500/20 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-yellow-400">⏳</span>
            <p className="text-gray-400 text-sm">Pending</p>
          </div>
          <p className="text-2xl font-bold text-yellow-400">${pendingTotal.toFixed(2)}</p>
          <p className="text-gray-500 text-sm mt-1">
            {allInvoices.filter((i) => i.status === "pending").length} awaiting payment
          </p>
        </div>
        <div className="bg-gray-900 border border-red-500/20 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-red-400">⚠️</span>
            <p className="text-gray-400 text-sm">Overdue</p>
          </div>
          <p className="text-2xl font-bold text-red-400">${overdueTotal.toFixed(2)}</p>
          <p className="text-gray-500 text-sm mt-1">
            {allInvoices.filter((i) => i.status === "overdue").length} overdue invoices
          </p>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">All Invoices</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-6 py-3 text-gray-400 text-sm font-medium">Invoice #</th>
                <th className="text-left px-6 py-3 text-gray-400 text-sm font-medium">Project</th>
                <th className="text-left px-6 py-3 text-gray-400 text-sm font-medium">Period</th>
                <th className="text-right px-6 py-3 text-gray-400 text-sm font-medium">Subtotal</th>
                <th className="text-right px-6 py-3 text-gray-400 text-sm font-medium">Tax</th>
                <th className="text-right px-6 py-3 text-gray-400 text-sm font-medium">Total</th>
                <th className="text-left px-6 py-3 text-gray-400 text-sm font-medium">Due Date</th>
                <th className="text-left px-6 py-3 text-gray-400 text-sm font-medium">Status</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {allInvoices.map((invoice) => {
                const project = allProjects.find((p) => p.id === invoice.projectId);
                const invoicePayments = allPayments.filter((p) => p.invoiceId === invoice.id);
                const isOverdue =
                  invoice.status === "pending" &&
                  new Date(invoice.dueDate) < new Date();

                return (
                  <tr
                    key={invoice.id}
                    className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <p className="text-white font-mono text-sm font-medium">
                        {invoice.invoiceNumber}
                      </p>
                    </td>
                    <td className="px-6 py-4">
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
                    <td className="px-6 py-4 text-gray-400 text-sm">
                      {new Date(invoice.periodStart).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}{" "}
                      –{" "}
                      {new Date(invoice.periodEnd).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4 text-right text-gray-300 text-sm">
                      ${invoice.subtotal.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right text-gray-400 text-sm">
                      ${invoice.tax.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-white font-semibold">${invoice.total.toFixed(2)}</span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={isOverdue ? "text-red-400" : "text-gray-400"}>
                        {new Date(invoice.dueDate).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs px-2 py-1 rounded-full border font-medium ${statusColor[invoice.status] || "text-gray-400 bg-gray-400/10 border-gray-400/20"}`}
                      >
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/invoices/${invoice.id}`}
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
