import { NextResponse } from "next/server";
import { testConnection } from "@/lib/openstack/client";
import { isOpenStackConfigured } from "@/lib/openstack/config";

export async function GET() {
  if (!isOpenStackConfigured()) {
    return NextResponse.json(
      {
        success: false,
        error: "OpenStack is not configured. Please set environment variables.",
        configured: false,
      },
      { status: 200 }
    );
  }

  const result = await testConnection();
  return NextResponse.json({ ...result, configured: true });
}
