import type { NextRequest } from "next/server";

import { resolveDifyChatContext } from "@/lib/dify/chat-context";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ taskId: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { taskId } = await context.params;
    const body = await request.json().catch(() => null);

    if (!taskId) {
      return Response.json({ error: "taskId is required" }, { status: 400 });
    }

    const { DIFY_BASE_URL, apiKey, user } = resolveDifyChatContext(body?.user);

    const difyResponse = await fetch(`${DIFY_BASE_URL}/chat-messages/${taskId}/stop`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ user }),
    });

    if (!difyResponse.ok) {
      const errorText = await difyResponse.text().catch(() => "");
      return Response.json(
        { error: "Dify stop request failed", details: errorText },
        { status: difyResponse.status },
      );
    }

    const data = await difyResponse.json().catch(() => ({ result: "success" }));
    return Response.json(data);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 },
    );
  }
}
