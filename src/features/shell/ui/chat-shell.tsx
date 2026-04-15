"use client";

import { ChatInput } from "@/features/chat/ui/chat-input";
import { ChatThread } from "@/features/chat/ui/chat-thread";
import { stopChatGeneration, streamChat } from "@/features/chat/api/stream-chat";
import { uploadFile } from "@/features/chat/api/upload-file";
import { getRandomExampleQuestions } from "@/features/chat/model/data";
import { useChatStore } from "@/features/chat/model/store";
import type { ImageAttachment } from "@/features/chat/model/types";
import { ChatHeader } from "@/features/shell/ui/chat-header";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const EMPTY_ASSISTANT_FALLBACK_MESSAGE = "오류가 발생했어. 다시 한번 질문해줄래?";
const ABORTED_ASSISTANT_MESSAGE = "답변이 중단되었습니다.";

type ActiveStreamState = {
  controller: AbortController;
  userId: string;
  taskId: string | null;
};

export function ChatShell() {
  const {
    messages,
    conversationId,
    userId,
    status,
    errorMessage,
    processingStatus,
    pendingImages,
    hydrateSession,
    startNewConversation,
    addUserMessage,
    startAssistantMessage,
    appendAssistantChunk,
    finalizeConversationId,
    ensureAssistantMessageContent,
    setError,
    clearError,
    setProcessingStatus,
    addPendingImage,
    removePendingImage,
  } = useChatStore();

  const [input, setInput] = useState("");
  const [suggestionKey, setSuggestionKey] = useState(0);
  const [inputSuggestions, setInputSuggestions] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const activeStreamRef = useRef<ActiveStreamState | null>(null);

  useEffect(() => {
    hydrateSession();
  }, [hydrateSession]);

  useEffect(() => {
    if (errorMessage) {
      toast.error(errorMessage, {
        onAutoClose: () => clearError(),
        onDismiss: () => clearError(),
      });
    }
  }, [errorMessage, clearError]);

  const isStreaming = status === "streaming";
  const isReady = Boolean(userId);

  const refreshInputSuggestions = useCallback(() => {
    setInputSuggestions(getRandomExampleQuestions(2));
  }, []);

  useEffect(() => {
    if (messages.length > 0 || inputSuggestions.length > 0) return;
    refreshInputSuggestions();
  }, [messages.length, inputSuggestions.length, refreshInputSuggestions]);

  const stopActiveStream = useCallback(() => {
    const activeStream = activeStreamRef.current;
    if (!activeStream) return Promise.resolve();

    activeStreamRef.current = null;
    const stopPromise = activeStream.taskId
      ? stopChatGeneration({
          taskId: activeStream.taskId,
          userId: activeStream.userId,
        }).catch(() => undefined)
      : Promise.resolve(undefined);

    activeStream.controller.abort();
    finalizeConversationId();

    return stopPromise;
  }, [finalizeConversationId]);

  useEffect(() => {
    return () => {
      activeStreamRef.current?.controller.abort();
      activeStreamRef.current = null;
    };
  }, []);

  const handleCapture = useCallback(
    async (file: File) => {
      if (!userId) return;
      setIsUploading(true);
      try {
        const previewUrl = URL.createObjectURL(file);
        const result = await uploadFile(file, userId);
        const attachment: ImageAttachment = {
          type: "image",
          transfer_method: "local_file",
          upload_file_id: result.id,
          previewUrl,
        };
        addPendingImage(attachment);
      } catch (e) {
        const message = e instanceof Error ? e.message : "이미지 업로드에 실패했습니다.";
        toast.error(message);
      } finally {
        setIsUploading(false);
      }
    },
    [userId, addPendingImage],
  );

  const handleSend = useCallback(
    async (nextValue?: string) => {
      const sourceValue = typeof nextValue === "string" ? nextValue : input;
      const trimmed = sourceValue.trim();

      const {
        conversationId: currentConversationId,
        status: currentStatus,
        userId: currentUserId,
        pendingImages: currentPendingImages,
      } = useChatStore.getState();

      if (!trimmed && currentPendingImages.length === 0) return;
      if (currentStatus === "streaming" || !currentUserId) return;

      const imagesToSend = [...currentPendingImages];
      const query = trimmed || "이 식물이 뭔지 알려줘!";

      clearError();
      addUserMessage(query, imagesToSend.length > 0 ? imagesToSend : undefined);
      const assistantId = startAssistantMessage();
      setInput("");
      const streamController = new AbortController();
      const activeStream: ActiveStreamState = {
        controller: streamController,
        userId: currentUserId,
        taskId: null,
      };
      activeStreamRef.current = activeStream;

      const files =
        imagesToSend.length > 0
          ? imagesToSend.map(({ type, transfer_method, upload_file_id }) => ({
              type,
              transfer_method,
              upload_file_id,
            }))
          : undefined;

      try {
        await streamChat({
          query,
          conversationId: currentConversationId,
          userId: currentUserId,
          files,
          signal: streamController.signal,
          onChunk: (chunk) => appendAssistantChunk(assistantId, chunk),
          onConversationId: (nextId) => finalizeConversationId(nextId),
          onTaskId: (taskId) => {
            if (activeStreamRef.current === activeStream) {
              activeStream.taskId = taskId;
            }
          },
          onError: (message) => {
            ensureAssistantMessageContent(assistantId, EMPTY_ASSISTANT_FALLBACK_MESSAGE);
            setError(message);
          },
          onAbort: () => {
            ensureAssistantMessageContent(assistantId, ABORTED_ASSISTANT_MESSAGE);
          },
          onDone: () => {
            ensureAssistantMessageContent(assistantId, EMPTY_ASSISTANT_FALLBACK_MESSAGE);
            finalizeConversationId();
          },
          onNodeStart: (nodeStatus) => setProcessingStatus(nodeStatus),
        });
      } finally {
        if (activeStreamRef.current === activeStream) {
          activeStreamRef.current = null;
        }
      }
    },
    [
      input,
      clearError,
      addUserMessage,
      startAssistantMessage,
      appendAssistantChunk,
      finalizeConversationId,
      ensureAssistantMessageContent,
      setError,
      setProcessingStatus,
    ],
  );

  const handleNewConversation = useCallback(() => {
    void stopActiveStream();
    startNewConversation();
    setInput("");
    refreshInputSuggestions();
    setSuggestionKey((prev) => prev + 1);
  }, [stopActiveStream, startNewConversation, refreshInputSuggestions]);

  return (
    <main className="desktop-page-backdrop fixed inset-0 flex h-[100svh] w-full flex-col overflow-hidden bg-background text-foreground supports-[height:100dvh]:h-[100dvh]">
      <div className="desktop-page-surface relative z-10 flex h-full w-full flex-col">
        {/* Header */}
        <div className="relative z-20 flex-none bg-background px-4 pt-[calc(env(safe-area-inset-top)+8px)] pb-2 md:px-0 md:py-6">
          <div className="mx-auto max-w-[600px]">
            <ChatHeader onNewConversation={handleNewConversation} />
          </div>
        </div>

        {/* Chat Thread */}
        <div className="flex-1 min-h-0 w-full overflow-hidden">
          <ChatThread
            key={suggestionKey}
            messages={messages}
            status={status}
            processingStatus={processingStatus}
          />
        </div>

        {/* Input Area */}
        <div className="relative z-20 flex-none w-full bg-background px-4 pt-2 pb-[calc(env(safe-area-inset-bottom)+12px)] md:px-0 md:pb-6">
          <div className="mx-auto w-full max-w-[600px] space-y-2">
            {messages.length === 0 && inputSuggestions.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {inputSuggestions.map((question) => (
                  <button
                    key={question}
                    type="button"
                    onClick={() => setInput(question)}
                    className="rounded-[18px] bg-emerald-50 px-3.5 py-3 text-left text-xs leading-snug font-semibold tracking-[-0.01em] text-emerald-700/80 hover:bg-emerald-100 hover:text-emerald-800 sm:text-sm"
                  >
                    {question}
                  </button>
                ))}
              </div>
            )}
            <ChatInput
              value={input}
              onChange={setInput}
              onSend={handleSend}
              onStop={() => {
                void stopActiveStream();
              }}
              onCapture={handleCapture}
              isStreaming={isStreaming}
              disabled={!isReady}
              pendingImages={pendingImages}
              onRemoveImage={removePendingImage}
              isUploading={isUploading}
            />
            {!isReady && (
              <p className="text-center text-xs text-muted-foreground font-medium animate-fade-in">
                준비 중입니다...
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
