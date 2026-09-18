import { beforeEach, describe, expect, it } from "vitest";
import { z } from "zod";
import { HttpRequestError, parseBoundedJson } from "../src/lib/http/json";
import { checkQuoteRateLimit, clearQuoteRateLimitForTests } from "../src/lib/http/rate-limit";

const schema = z.object({ value: z.string() });

describe("HTTP request hardening", () => {
  beforeEach(() => clearQuoteRateLimitForTests());

  it("requires JSON and validates the parsed object", async () => {
    const valid = new Request("https://example.test/api", {
      method: "POST",
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify({ value: "safe" }),
    });
    await expect(parseBoundedJson(valid, schema, 100)).resolves.toEqual({ value: "safe" });

    const wrongType = new Request("https://example.test/api", { method: "POST", body: "value=safe" });
    await expect(parseBoundedJson(wrongType, schema, 100)).rejects.toMatchObject<Partial<HttpRequestError>>({ status: 415 });
  });

  it("rejects actual streamed bytes beyond the limit without trusting Content-Length", async () => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('{"value":"'));
        controller.enqueue(new TextEncoder().encode("x".repeat(200)));
        controller.enqueue(new TextEncoder().encode('"}'));
        controller.close();
      },
    });
    const request = new Request("https://example.test/api", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: stream,
      duplex: "half",
    } as RequestInit & { duplex: "half" });
    await expect(parseBoundedJson(request, schema, 100)).rejects.toMatchObject<Partial<HttpRequestError>>({ status: 413 });
  });

  it("limits quote bursts per forwarded client", () => {
    const request = new Request("https://example.test/api/quotes", { headers: { "x-forwarded-for": "203.0.113.7" } });
    for (let index = 0; index < 12; index += 1) expect(checkQuoteRateLimit(request, 1_000).allowed).toBe(true);
    expect(checkQuoteRateLimit(request, 1_000)).toMatchObject({ allowed: false, remaining: 0, retryAfterSeconds: 60 });
    expect(checkQuoteRateLimit(request, 61_001)).toMatchObject({ allowed: true, remaining: 11 });
  });
});
