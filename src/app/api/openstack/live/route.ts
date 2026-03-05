import { NextResponse } from "next/server";
import { fetchOpenStackData } from "@/lib/openstack/client";
import { isOpenStackConfigured } from "@/lib/openstack/config";

export async function GET() {
  if (!isOpenStackConfigured()) {
    return NextResponse.json(
      { error: "OpenStack is not configured", configured: false },
      { status: 200 }
    );
  }

  try {
    const data = await fetchOpenStackData();
    return NextResponse.json({ ...data, configured: true });
  } catch (err) {
    console.error("OpenStack live data error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch OpenStack data", configured: true },
      { status: 500 }
    );
  }
}
