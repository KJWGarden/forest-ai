type ServerEnv = {
  DIFY_BASE_URL: string;
  DIFY_API_KEY: string;
};

type ElevenLabsEnv = {
  ELEVENLABS_API_KEY: string;
};

export function getElevenLabsEnv(): ElevenLabsEnv {
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!apiKey) {
    throw new Error("Missing required server env: ELEVENLABS_API_KEY");
  }

  return { ELEVENLABS_API_KEY: apiKey };
}

export function getServerEnv(): ServerEnv {
  const baseUrl = process.env.DIFY_BASE_URL;
  const apiKey = process.env.DIFY_API_KEY;

  if (!baseUrl || !apiKey) {
    const missing = [!baseUrl ? "DIFY_BASE_URL" : null, !apiKey ? "DIFY_API_KEY" : null]
      .filter(Boolean)
      .join(", ");
    throw new Error(`Missing required server env: ${missing}`);
  }

  return { DIFY_BASE_URL: baseUrl, DIFY_API_KEY: apiKey };
}
