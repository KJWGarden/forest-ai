import type { NextRequest } from "next/server";

import { resolveDifyChatContext } from "@/lib/dify/chat-context";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);

    if (!body || typeof body.query !== "string" || body.query.length === 0) {
      return Response.json({ error: "query is required" }, { status: 400 });
    }

    const conversationId = typeof body.conversation_id === "string" ? body.conversation_id : "";
    const files = Array.isArray(body.files) && body.files.length > 0 ? body.files : undefined;
    const { DIFY_BASE_URL, apiKey, user } = resolveDifyChatContext(body.user);

    const difyPayload: Record<string, unknown> = {
      inputs: { plant_name: body.query },
      query: body.query,
      response_mode: "streaming",
      conversation_id: conversationId,
      user,
    };
    if (files) {
      difyPayload.files = files;
    }

    const difyResponse = await fetch(`${DIFY_BASE_URL}/chat-messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(difyPayload),
    });

    if (!difyResponse.ok || !difyResponse.body) {
      const errorText = await difyResponse.text().catch(() => "");
      console.error("[chat] Dify error:", difyResponse.status, errorText);
      return Response.json(
        { error: "Dify request failed", details: errorText },
        { status: difyResponse.status },
      );
    }

    return new Response(difyResponse.body, {
      status: difyResponse.status,
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("[chat] Server error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 },
    );
  }
}
