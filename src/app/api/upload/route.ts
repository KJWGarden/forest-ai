import type { NextRequest } from "next/server";

import { resolveDifyChatContext } from "@/lib/dify/chat-context";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const requestUser = formData.get("user");

    if (!file || !(file instanceof Blob)) {
      return Response.json({ error: "file is required" }, { status: 400 });
    }

    const { DIFY_BASE_URL, apiKey, user } = resolveDifyChatContext(
      typeof requestUser === "string" ? requestUser : null,
    );

    const difyFormData = new FormData();
    difyFormData.append("file", file);
    difyFormData.append("user", user);

    const difyResponse = await fetch(`${DIFY_BASE_URL}/files/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: difyFormData,
    });

    if (!difyResponse.ok) {
      const errorText = await difyResponse.text().catch(() => "");
      return Response.json(
        { error: "Dify upload failed", details: errorText },
        { status: difyResponse.status },
      );
    }

    const data = await difyResponse.json();
    return Response.json(data);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 },
    );
  }
}
