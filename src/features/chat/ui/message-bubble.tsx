"use client";

import { Streamdown } from "streamdown";
import { memo } from "react";
import Image from "next/image";

import type { ChatMessage } from "@/features/chat/model/types";
import { cn } from "@/lib/utils";

type MessageBubbleProps = {
  message: ChatMessage;
  isStreaming?: boolean;
  processingStatus?: string | null;
};

export const MessageBubble = memo(function MessageBubble({
  message,
  isStreaming,
  processingStatus,
}: MessageBubbleProps) {
  const isUser = message.role === "user";
  const showProcessingStatus = !isUser && isStreaming && processingStatus && !message.content;

  return (
    <div
      className={cn("flex w-full mb-4 animate-slide-up", isUser ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "max-w-[85%] rounded-4xl px-4 py-2 text-sm md:text-base leading-relaxed transition-all",
          isUser
            ? "bg-linear-to-br from-emerald-700 to-emerald-800 text-white rounded-tr-sm shadow-md"
            : "glass-panel text-foreground rounded-tl-sm",
        )}
      >
        {isUser ? (
          <div>
            {message.images && message.images.length > 0 && (
              <div className="flex gap-2 mb-2">
                {message.images.map((img) => (
                  <div
                    key={img.upload_file_id}
                    className="relative h-20 w-20 overflow-hidden rounded-xl"
                  >
                    <Image
                      src={img.previewUrl}
                      alt="첨부 이미지"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                ))}
              </div>
            )}
            <p className="whitespace-pre-wrap wrap-break-words font-medium">{message.content}</p>
          </div>
        ) : (
          <div className="relative min-h-[24px]">
            {showProcessingStatus ? (
              <div
                key="status"
                className="flex items-center gap-2 text-muted-foreground animate-fade-in"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300/80 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                </span>
                <span>{processingStatus}</span>
              </div>
            ) : (
              <div key="content" className="animate-fade-in">
                <Streamdown
                  className="streamdown leading-relaxed space-y-4"
                  isAnimating={Boolean(isStreaming)}
                >
                  {message.content || " "}
                </Streamdown>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});
