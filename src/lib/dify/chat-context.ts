import { getServerEnv } from "@/lib/env";
import { createId } from "@/lib/id";

type ResolvedDifyChatContext = {
  DIFY_BASE_URL: string;
  apiKey: string;
  user: string;
};

export function resolveDifyChatContext(requestUser?: string | null): ResolvedDifyChatContext {
  const { DIFY_BASE_URL, DIFY_API_KEY } = getServerEnv();

  const user =
    typeof requestUser === "string" && requestUser.length > 0
      ? requestUser
      : `server_${createId()}`;

  return { DIFY_BASE_URL, apiKey: DIFY_API_KEY, user };
}
