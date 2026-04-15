"use client";

import type { ChatMessage, ChatStatus } from "@/features/chat/model/types";
import { EmptyState } from "@/features/chat/ui/empty-state";
import { MessageBubble } from "@/features/chat/ui/message-bubble";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export function ChatThread({
  messages,
  status,
  processingStatus,
}: {
  messages: ChatMessage[];
  status: ChatStatus;
  processingStatus: string | null;
}) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: status === "streaming" ? "auto" : "smooth",
    });
  }, [messages, status]);

  const streamingMessageId =
    status === "streaming"
      ? [...messages].reverse().find((message) => message.role === "assistant")?.id
      : undefined;

  return (
    <div className="h-full w-full overflow-y-auto overscroll-contain scroll-smooth">
      <div className="relative mx-auto min-h-full max-w-[600px] px-4 pt-6 pb-4 text-center md:px-0 md:pt-8">
        {messages.length === 0 && (
          <div className="absolute inset-0 z-0 flex items-center justify-center px-4 pb-12">
            <EmptyState />
          </div>
        )}

        <div
          className={cn(
            "relative z-10 flex flex-col gap-6 pb-4 text-left transition-opacity duration-300",
            messages.length > 0 ? "opacity-100" : "opacity-0 pointer-events-none",
          )}
        >
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isStreaming={message.id === streamingMessageId}
              processingStatus={processingStatus}
            />
          ))}
          <div ref={bottomRef} className="h-4" />
        </div>
      </div>
    </div>
  );
}
