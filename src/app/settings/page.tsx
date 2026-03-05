import { isOpenStackConfigured, getOpenStackConfig } from "@/lib/openstack/config";
import { SyncButton } from "./SyncButton";

export default async function SettingsPage() {
  const configured = isOpenStackConfigured();
  let config = null;
  if (configured) {
    try {
      config = getOpenStackConfig();
    } catch {
      // ignore
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="text-gray-400 mt-1">OpenStack Kolla environment connection</p>
      </div>

      {/* Connection Status */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Connection Status</h2>

        {configured ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <span className="text-green-400 text-xl">✓</span>
              <div>
                <p className="text-green-400 font-medium">OpenStack configured</p>
                <p className="text-gray-400 text-sm">Environment variables are set</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-400 text-sm mb-1">Auth URL</p>
                <code className="text-orange-400 text-sm bg-gray-800 px-2 py-1 rounded block">
                  {config?.authUrl}
                </code>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">Username</p>
                <code className="text-orange-400 text-sm bg-gray-800 px-2 py-1 rounded block">
                  {config?.username}
                </code>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">Project</p>
                <code className="text-orange-400 text-sm bg-gray-800 px-2 py-1 rounded block">
                  {config?.projectName}
                </code>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">Region</p>
                <code className="text-orange-400 text-sm bg-gray-800 px-2 py-1 rounded block">
                  {config?.regionName}
                </code>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <p className="text-yellow-400 font-medium">⚠️ OpenStack not configured</p>
            <p className="text-gray-400 text-sm mt-1">
              Set the following environment variables to connect to your Kolla environment:
            </p>
          </div>
        )}
      </div>

      {/* Environment Variables Guide */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Configuration</h2>
        <p className="text-gray-400 text-sm mb-4">
          Create a <code className="text-orange-400 bg-gray-800 px-1 rounded">.env.local</code> file
          in the project root with these variables:
        </p>
        <pre className="bg-gray-800 rounded-lg p-4 text-sm overflow-x-auto">
          <code className="text-green-400">{`# OpenStack Kolla Environment
OS_AUTH_URL=http://YOUR_KOLLA_IP:5000
OS_USERNAME=admin
OS_PASSWORD=your_admin_password
OS_PROJECT_NAME=admin
OS_USER_DOMAIN_NAME=Default
OS_PROJECT_DOMAIN_NAME=Default
OS_REGION_NAME=RegionOne`}</code>
        </pre>
        <p className="text-gray-500 text-xs mt-3">
          💡 Find your Kolla credentials in{" "}
          <code className="text-orange-400">/etc/kolla/admin-openrc.sh</code> on your Kolla host.
        </p>
      </div>

      {/* Sync Section */}
      {configured && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-2">Sync Data</h2>
          <p className="text-gray-400 text-sm mb-4">
            Pull the latest projects, servers, volumes, and network resources from your OpenStack
            environment into the billing database.
          </p>
          <SyncButton />
        </div>
      )}

      {/* What Gets Synced */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">What Gets Synced</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: "🏗️", label: "Projects/Tenants", desc: "From Keystone identity service" },
            { icon: "🖥️", label: "Compute Instances", desc: "Nova servers with flavor info" },
            { icon: "💾", label: "Block Volumes", desc: "Cinder volumes with size" },
            { icon: "🌐", label: "Floating IPs", desc: "Neutron floating IP addresses" },
            { icon: "⚖️", label: "Load Balancers", desc: "Octavia LBaaS instances" },
            { icon: "📊", label: "Hypervisor Stats", desc: "Cluster capacity overview" },
          ].map((item) => (
            <div key={item.label} className="flex items-start gap-3 p-3 bg-gray-800 rounded-lg">
              <span className="text-xl">{item.icon}</span>
              <div>
                <p className="text-white text-sm font-medium">{item.label}</p>
                <p className="text-gray-500 text-xs">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
