import { getElevenLabsEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

// eleven_multilingual_v2 input limit is 10,000 chars; keep a conservative cap.
const MAX_INPUT_LENGTH = 4000;
const DEFAULT_VOICE_ID = "n2fbxG88jqAoaVPUy3IG";
const DEFAULT_MODEL_ID = "eleven_multilingual_v2";

function stripMarkdown(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/^\s*>\s?/gm, "")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)([^*_]+)\2/g, "$2")
    .replace(/~~(.*?)~~/g, "$1")
    .replace(/^\s*[-*_]{3,}\s*$/gm, " ")
    .replace(/\|/g, " ")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const text = body?.text;

    if (typeof text !== "string" || !text.trim()) {
      return Response.json({ error: "text is required" }, { status: 400 });
    }

    const { ELEVENLABS_API_KEY } = getElevenLabsEnv();
    const input = stripMarkdown(text).slice(0, MAX_INPUT_LENGTH);

    if (!input) {
      return Response.json({ error: "text has no readable content" }, { status: 400 });
    }

    const voiceId = process.env.ELEVENLABS_VOICE_ID || DEFAULT_VOICE_ID;
    const modelId = process.env.ELEVENLABS_MODEL_ID || DEFAULT_MODEL_ID;

    const elevenLabsResponse = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: input,
          model_id: modelId,
        }),
      },
    );

    if (!elevenLabsResponse.ok || !elevenLabsResponse.body) {
      const errorText = await elevenLabsResponse.text().catch(() => "");
      return Response.json(
        { error: "TTS request failed", details: errorText },
        { status: elevenLabsResponse.status },
      );
    }

    return new Response(elevenLabsResponse.body, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 },
    );
  }
}
