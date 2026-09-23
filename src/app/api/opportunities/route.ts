import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  return NextResponse.json(
    {
      error: "endpoint_retired",
      message:
        "Bulk market scanning is not available. Compare one supported asset at a time.",
    },
    { status: 410, headers: { "cache-control": "no-store" } },
  );
}
