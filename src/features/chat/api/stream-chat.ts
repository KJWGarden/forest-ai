"use client";

import { createSseParser } from "@/features/chat/model/utils";
import type { ImageAttachment } from "@/features/chat/model/types";

export type ChatStreamHandlers = {
  onChunk: (chunk: string) => void;
  onConversationId: (conversationId: string) => void;
  onTaskId?: (taskId: string) => void;
  onError: (message: string) => void;
  onDone?: () => void;
  onNodeStart?: (status: string) => void;
  onAbort?: () => void;
};

type ChatStreamParams = {
  query: string;
  conversationId?: string | null;
  userId: string;
  files?: Pick<ImageAttachment, "type" | "transfer_method" | "upload_file_id">[];
  timeoutMs?: number;
  signal?: AbortSignal;
} & ChatStreamHandlers;

export async function streamChat({
  query,
  conversationId,
  userId,
  files,
  timeoutMs = 60000,
  signal,
  onChunk,
  onConversationId,
  onTaskId,
  onError,
  onDone,
  onNodeStart,
  onAbort,
}: ChatStreamParams) {
  const controller = new AbortController();
  const parser = createSseParser();
  let lastActivity = Date.now();
  let didError = false;
  let wasAborted = false;
  let abortReason: "manual" | "timeout" | null = null;

  const abortWithReason = (reason: "manual" | "timeout") => {
    if (controller.signal.aborted) return;
    abortReason = reason;
    controller.abort();
  };

  const handleExternalAbort = () => abortWithReason("manual");
  if (signal) {
    if (signal.aborted) {
      abortWithReason("manual");
    } else {
      signal.addEventListener("abort", handleExternalAbort);
    }
  }

  const timeout = setInterval(() => {
    if (Date.now() - lastActivity > timeoutMs) {
      abortWithReason("timeout");
    }
  }, 1000);

  try {
    const bodyPayload: Record<string, unknown> = {
      query,
      conversation_id: conversationId ?? "",
      user: userId,
    };
    if (files && files.length > 0) {
      bodyPayload.files = files.map(({ type, transfer_method, upload_file_id }) => ({
        type,
        transfer_method,
        upload_file_id,
      }));
    }

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bodyPayload),
      signal: controller.signal,
    });

    if (!response.ok || !response.body) {
      const contentType = response.headers.get("content-type") ?? "";
      const payload = contentType.includes("application/json")
        ? await response.json().catch(() => null)
        : null;
      const message =
        payload?.error ||
        payload?.message ||
        (await response.text().catch(() => "")) ||
        `Request failed (${response.status})`;
      didError = true;
      onError(message);
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    const processEvents = (events: string[]) => {
      for (const data of events) {
        let payload: Record<string, unknown> | null = null;
        try {
          payload = JSON.parse(data);
        } catch {
          payload = null;
        }
        if (!payload) continue;

        const taskId = typeof payload.task_id === "string" ? payload.task_id : "";
        if (taskId) onTaskId?.(taskId);

        const event = payload.event;
        // Chat app events
        if (event === "message") {
          const answer = typeof payload.answer === "string" ? payload.answer : "";
          if (answer) onChunk(answer);
          const convId = typeof payload.conversation_id === "string" ? payload.conversation_id : "";
          if (convId) onConversationId(convId);
        }
        if (event === "message_end") {
          const nextId =
            typeof payload.conversation_id === "string" ? payload.conversation_id : "";
          if (nextId) onConversationId(nextId);
        }
        // Workflow app events
        if (event === "text_chunk") {
          const nodeData = payload.data as Record<string, unknown> | undefined;
          const text = typeof nodeData?.text === "string" ? nodeData.text : "";
          if (text) onChunk(text);
        }
        if (event === "workflow_finished") {
          const nodeData = payload.data as Record<string, unknown> | undefined;
          const outputs = nodeData?.outputs as Record<string, unknown> | undefined;
          const text = typeof outputs?.text === "string" ? outputs.text : "";
          if (text && text.length > 0) {
            // Final output from workflow - already streamed via text_chunk
          }
        }
        if (event === "workflow_started") {
          onNodeStart?.("식물을 관찰하고 있어요...");
        }
        if (event === "node_started") {
          const nodeData = payload.data as Record<string, unknown> | undefined;
          const nodeType = nodeData?.node_type as string | undefined;
          const title = nodeData?.title as string | undefined;

          if (nodeType === "knowledge-retrieval") {
            if (title?.includes("식물")) {
              onNodeStart?.("식물 도감에서 정보를 찾고 있어요...");
            } else if (title?.includes("숲")) {
              onNodeStart?.("숲 자료에서 관련 정보를 찾는 중...");
            } else {
              onNodeStart?.("관련 정보를 찾고 있어요...");
            }
          }
        }
        if (event === "error") {
          const message =
            typeof payload.message === "string" ? payload.message : "Streaming error";
          didError = true;
          onError(message);
          return;
        }
      }
    };

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      lastActivity = Date.now();
      const chunkText = decoder.decode(value, { stream: true });
      processEvents(parser(chunkText));
    }

    const remaining = decoder.decode();
    if (remaining) processEvents(parser(remaining));
    processEvents(parser("\n\n"));
  } catch (error) {
    if (controller.signal.aborted) {
      if (abortReason === "manual") {
        wasAborted = true;
        onAbort?.();
        return;
      }
      didError = true;
      onError("응답이 지연되어 연결이 종료되었습니다. 다시 시도해주세요.");
      return;
    }
    if (error instanceof Error) {
      didError = true;
      onError(error.message || "네트워크 오류가 발생했습니다.");
      return;
    }
    didError = true;
    onError("알 수 없는 오류가 발생했습니다.");
  } finally {
    clearInterval(timeout);
    if (signal) {
      signal.removeEventListener("abort", handleExternalAbort);
    }
    if (!didError && !wasAborted) onDone?.();
  }
}

type StopChatGenerationParams = {
  taskId: string;
  userId: string;
};

export async function stopChatGeneration({ taskId, userId }: StopChatGenerationParams) {
  const response = await fetch(`/api/chat/${taskId}/stop`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify({ user: userId }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const message =
      payload?.error ||
      payload?.details ||
      (await response.text().catch(() => "")) ||
      `Request failed (${response.status})`;
    throw new Error(typeof message === "string" ? message : "Failed to stop chat generation");
  }

  return response.json().catch(() => ({ result: "success" as const }));
}
