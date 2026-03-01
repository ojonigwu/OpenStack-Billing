import { db } from "@/db";
import { resourceTypes } from "@/db/schema";

export default async function PricingPage() {
  const allResourceTypes = await db.select().from(resourceTypes);

  const categories = ["compute", "storage", "network", "database"];

  const categoryConfig: Record<string, { icon: string; color: string; description: string }> = {
    compute: {
      icon: "🖥️",
      color: "border-blue-500/30 bg-blue-500/5",
      description: "Virtual machine instances with various CPU and memory configurations",
    },
    storage: {
      icon: "💾",
      color: "border-purple-500/30 bg-purple-500/5",
      description: "Block storage, object storage, and file system options",
    },
    network: {
      icon: "🌐",
      color: "border-green-500/30 bg-green-500/5",
      description: "Floating IPs, load balancers, and bandwidth",
    },
    database: {
      icon: "🗄️",
      color: "border-yellow-500/30 bg-yellow-500/5",
      description: "Managed database services",
    },
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Pricing</h1>
        <p className="text-gray-400 mt-1">
          OpenStack resource pricing — pay only for what you use
        </p>
      </div>

      {/* Pricing Note */}
      <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 flex items-start gap-3">
        <span className="text-orange-400 text-xl">💡</span>
        <div>
          <p className="text-orange-300 font-medium">Usage-Based Billing</p>
          <p className="text-gray-400 text-sm mt-1">
            All resources are billed per hour of usage. Partial hours are rounded up. Storage is
            billed per GB-hour. Bandwidth is billed per GB transferred.
          </p>
        </div>
      </div>

      {/* Category Sections */}
      {categories.map((category) => {
        const categoryTypes = allResourceTypes.filter(
          (rt) => rt.category === category && rt.isActive
        );
        if (categoryTypes.length === 0) return null;

        const config = categoryConfig[category] || {
          icon: "📦",
          color: "border-gray-700",
          description: "",
        };

        return (
          <div key={category} className={`bg-gray-900 border rounded-xl overflow-hidden ${config.color}`}>
            <div className="px-6 py-5 border-b border-gray-800">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{config.icon}</span>
                <div>
                  <h2 className="text-xl font-semibold text-white capitalize">{category}</h2>
                  <p className="text-gray-400 text-sm">{config.description}</p>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left px-6 py-3 text-gray-400 text-sm font-medium">
                      Resource Type
                    </th>
                    <th className="text-left px-6 py-3 text-gray-400 text-sm font-medium">
                      Description
                    </th>
                    <th className="text-right px-6 py-3 text-gray-400 text-sm font-medium">
                      Unit
                    </th>
                    <th className="text-right px-6 py-3 text-gray-400 text-sm font-medium">
                      Price per Unit
                    </th>
                    <th className="text-right px-6 py-3 text-gray-400 text-sm font-medium">
                      Est. Monthly
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {categoryTypes.map((rt) => {
                    // Estimate monthly cost (730 hours/month)
                    const monthlyEstimate = rt.pricePerUnit * 730;

                    return (
                      <tr
                        key={rt.id}
                        className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <code className="text-orange-400 bg-orange-400/10 px-2 py-1 rounded text-sm">
                            {rt.name}
                          </code>
                        </td>
                        <td className="px-6 py-4 text-gray-400 text-sm">{rt.description}</td>
                        <td className="px-6 py-4 text-right text-gray-300 text-sm">{rt.unit}</td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-white font-semibold">
                            ${rt.pricePerUnit.toFixed(4)}
                          </span>
                          <span className="text-gray-500 text-xs ml-1">/{rt.unit}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {rt.unit === "GB" ? (
                            <span className="text-gray-500 text-sm">varies</span>
                          ) : (
                            <span className="text-orange-400 font-medium">
                              ${monthlyEstimate.toFixed(2)}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {/* Cost Calculator Note */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-3">💰 Cost Examples</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-800 rounded-lg">
            <p className="text-white font-medium text-sm">Small Web App</p>
            <p className="text-gray-400 text-xs mt-1">1x m1.small + 50GB SSD + 1 Floating IP</p>
            <p className="text-orange-400 font-bold text-lg mt-2">~$33/mo</p>
          </div>
          <div className="p-4 bg-gray-800 rounded-lg">
            <p className="text-white font-medium text-sm">Medium API Service</p>
            <p className="text-gray-400 text-xs mt-1">2x m1.medium + 200GB SSD + Load Balancer</p>
            <p className="text-orange-400 font-bold text-lg mt-2">~$95/mo</p>
          </div>
          <div className="p-4 bg-gray-800 rounded-lg">
            <p className="text-white font-medium text-sm">Large Production</p>
            <p className="text-gray-400 text-xs mt-1">4x m1.large + 1TB SSD + LB + 2 IPs</p>
            <p className="text-orange-400 font-bold text-lg mt-2">~$560/mo</p>
          </div>
        </div>
      </div>
    </div>
  );
}
