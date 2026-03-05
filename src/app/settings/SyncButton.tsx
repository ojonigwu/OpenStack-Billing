"use client";

import { useState } from "react";

interface SyncResult {
  success?: boolean;
  error?: string;
  syncedProjects?: number;
  syncedResources?: number;
  totals?: {
    projects: number;
    servers: number;
    volumes: number;
    floatingIPs: number;
    loadBalancers: number;
  };
}

export function SyncButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success?: boolean; error?: string; projectName?: string } | null>(null);

  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/openstack/test");
      const data = await res.json();
      setTestResult(data);
    } catch (err) {
      setTestResult({ success: false, error: String(err) });
    } finally {
      setTesting(false);
    }
  }

  async function handleSync() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/openstack/sync", { method: "POST" });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult({ error: String(err) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Test Connection */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleTest}
          disabled={testing}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white rounded-lg font-medium transition-colors text-sm"
        >
          {testing ? "Testing..." : "🔌 Test Connection"}
        </button>

        {testResult && (
          <div
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
              testResult.success
                ? "bg-green-500/10 text-green-400"
                : "bg-red-500/10 text-red-400"
            }`}
          >
            {testResult.success ? (
              <>✓ Connected as <strong>{testResult.projectName}</strong></>
            ) : (
              <>✗ {testResult.error}</>
            )}
          </div>
        )}
      </div>

      {/* Sync Button */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSync}
          disabled={loading}
          className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          {loading ? (
            <>
              <span className="animate-spin">⟳</span>
              Syncing...
            </>
          ) : (
            <>🔄 Sync from OpenStack</>
          )}
        </button>
      </div>

      {/* Sync Result */}
      {result && (
        <div
          className={`p-4 rounded-lg border ${
            result.success
              ? "bg-green-500/10 border-green-500/20"
              : "bg-red-500/10 border-red-500/20"
          }`}
        >
          {result.success ? (
            <div>
              <p className="text-green-400 font-medium mb-2">✓ Sync completed successfully</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-gray-400">
                  New projects: <span className="text-white">{result.syncedProjects}</span>
                </div>
                <div className="text-gray-400">
                  New resources: <span className="text-white">{result.syncedResources}</span>
                </div>
                {result.totals && (
                  <>
                    <div className="text-gray-400">
                      Total projects: <span className="text-white">{result.totals.projects}</span>
                    </div>
                    <div className="text-gray-400">
                      Servers: <span className="text-white">{result.totals.servers}</span>
                    </div>
                    <div className="text-gray-400">
                      Volumes: <span className="text-white">{result.totals.volumes}</span>
                    </div>
                    <div className="text-gray-400">
                      Floating IPs: <span className="text-white">{result.totals.floatingIPs}</span>
                    </div>
                  </>
                )}
              </div>
              <p className="text-gray-500 text-xs mt-2">
                Refresh the page to see updated data in the dashboard.
              </p>
            </div>
          ) : (
            <p className="text-red-400">✗ {result.error}</p>
          )}
        </div>
      )}
    </div>
  );
}
