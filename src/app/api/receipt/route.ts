import { z } from "zod";
import { openEnvelope, receiptPayloadSchema } from "@/lib/execution/envelope";
import { ExecutionError, executionErrorResponse } from "@/lib/execution/errors";
import { assertSameOrigin } from "@/lib/execution/gate";
import { loadConfirmedReceipt } from "@/lib/execution/receipt";
import { parseBoundedJson } from "@/lib/http/json";

export const runtime = "nodejs";
const schema = z.object({ receiptToken: z.string().max(8_000) });

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const secret = process.env.EXECUTION_INTENT_SECRET;
    if (!secret || secret.length < 32) throw new ExecutionError("execution_misconfigured", "Receipt verification is not configured.", 503);
    const input = await parseBoundedJson(request, schema, 10_000);
    const receipt = openEnvelope(input.receiptToken, receiptPayloadSchema, secret);
    return Response.json(await loadConfirmedReceipt(receipt), { headers: { "cache-control": "no-store" } });
  } catch (error) { return executionErrorResponse(error); }
}
