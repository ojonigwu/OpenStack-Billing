import { db } from "@/db";
import { invoices, projects, payments, resources, resourceTypes } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const invoiceId = parseInt(id);

  const [invoice] = await db.select().from(invoices).where(eq(invoices.id, invoiceId));
  if (!invoice) notFound();

  const [project] = await db.select().from(projects).where(eq(projects.id, invoice.projectId));
  const invoicePayments = await db.select().from(payments).where(eq(payments.invoiceId, invoiceId));
  const projectResources = await db.select().from(resources).where(eq(resources.projectId, invoice.projectId));
  const resourceTypeList = await db.select().from(resourceTypes);

  const statusColor: Record<string, string> = {
    paid: "text-green-400 bg-green-400/10 border-green-400/20",
    pending: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
    overdue: "text-red-400 bg-red-400/10 border-red-400/20",
    cancelled: "text-gray-400 bg-gray-400/10 border-gray-400/20",
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <Link href="/invoices" className="hover:text-orange-400">Invoices</Link>
        <span>/</span>
        <span className="text-white">{invoice.invoiceNumber}</span>
      </div>

      {/* Invoice Header */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-8">
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                OS
              </div>
              <span className="text-white font-semibold text-lg">OpenStack Billing</span>
            </div>
            <p className="text-gray-400 text-sm">Cloud Infrastructure Services</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-white">{invoice.invoiceNumber}</p>
            <span
              className={`text-sm px-3 py-1 rounded-full border font-medium mt-2 inline-block ${statusColor[invoice.status] || "text-gray-400 bg-gray-400/10 border-gray-400/20"}`}
            >
              {invoice.status.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Bill To */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <p className="text-gray-400 text-sm mb-2">BILL TO</p>
            <p className="text-white font-semibold">{project?.name || "—"}</p>
            <p className="text-gray-400 text-sm">{project?.tenantId}</p>
          </div>
          <div className="text-right">
            <div className="space-y-1">
              <div className="flex justify-between gap-8">
                <span className="text-gray-400 text-sm">Invoice Date:</span>
                <span className="text-white text-sm">
                  {new Date(invoice.createdAt!).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between gap-8">
                <span className="text-gray-400 text-sm">Due Date:</span>
                <span className="text-white text-sm">
                  {new Date(invoice.dueDate).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between gap-8">
                <span className="text-gray-400 text-sm">Period:</span>
                <span className="text-white text-sm">
                  {new Date(invoice.periodStart).toLocaleDateString()} –{" "}
                  {new Date(invoice.periodEnd).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Line Items - Resources */}
        <div className="border border-gray-700 rounded-lg overflow-hidden mb-6">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-800">
                <th className="text-left px-4 py-3 text-gray-400 text-sm font-medium">Resource</th>
                <th className="text-left px-4 py-3 text-gray-400 text-sm font-medium">Type</th>
                <th className="text-right px-4 py-3 text-gray-400 text-sm font-medium">Qty</th>
                <th className="text-right px-4 py-3 text-gray-400 text-sm font-medium">Unit Price</th>
                <th className="text-right px-4 py-3 text-gray-400 text-sm font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {projectResources.map((resource) => {
                const rt = resourceTypeList.find((r) => r.id === resource.resourceTypeId);
                // Estimate hours in billing period
                const periodHours =
                  (new Date(invoice.periodEnd).getTime() -
                    new Date(invoice.periodStart).getTime()) /
                  (1000 * 60 * 60);
                const unitPrice = rt?.pricePerUnit || 0;
                const amount = unitPrice * resource.quantity * (periodHours / 730); // normalize to ~month

                return (
                  <tr key={resource.id} className="border-t border-gray-700">
                    <td className="px-4 py-3">
                      <p className="text-white text-sm">{resource.name}</p>
                      <p className="text-gray-500 text-xs font-mono">{resource.instanceId}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-sm">{rt?.name || "—"}</td>
                    <td className="px-4 py-3 text-right text-gray-300 text-sm">
                      {resource.quantity} {rt?.unit?.replace("-hour", "") || ""}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-400 text-sm">
                      ${unitPrice.toFixed(4)}/{rt?.unit || "unit"}
                    </td>
                    <td className="px-4 py-3 text-right text-white text-sm font-medium">
                      ${amount.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-64 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Subtotal</span>
              <span className="text-white">${invoice.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Tax (10%)</span>
              <span className="text-white">${invoice.tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-base font-semibold border-t border-gray-700 pt-2">
              <span className="text-white">Total</span>
              <span className="text-orange-400 text-lg">${invoice.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Paid stamp */}
        {invoice.status === "paid" && invoice.paidAt && (
          <div className="mt-6 p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-2">
            <span className="text-green-400">✓</span>
            <p className="text-green-400 text-sm">
              Paid on {new Date(invoice.paidAt).toLocaleDateString()}
            </p>
          </div>
        )}

        {invoice.status === "overdue" && (
          <div className="mt-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2">
            <span className="text-red-400">⚠️</span>
            <p className="text-red-400 text-sm">
              This invoice is overdue. Due date was {new Date(invoice.dueDate).toLocaleDateString()}.
            </p>
          </div>
        )}
      </div>

      {/* Payment History */}
      {invoicePayments.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Payment History</h2>
          <div className="space-y-3">
            {invoicePayments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                <div>
                  <p className="text-white text-sm font-medium capitalize">{payment.method.replace("_", " ")}</p>
                  {payment.transactionId && (
                    <p className="text-gray-500 text-xs font-mono">{payment.transactionId}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-green-400 font-semibold">${payment.amount.toFixed(2)}</p>
                  <p className="text-gray-500 text-xs">
                    {payment.createdAt ? new Date(payment.createdAt).toLocaleDateString() : "—"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
