import { getExecutionStatus } from "@/lib/execution/gate";

export const runtime = "nodejs";
export function GET() { return Response.json(getExecutionStatus(), { headers: { "cache-control": "no-store" } }); }
