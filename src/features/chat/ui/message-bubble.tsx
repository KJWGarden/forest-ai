"use client";

import { Streamdown } from "streamdown";
import { memo } from "react";
import Image from "next/image";
import { SquareIcon, Volume2Icon } from "lucide-react";
import { toast } from "sonner";

import type { ChatMessage } from "@/features/chat/model/types";
import { useTtsStore } from "@/features/chat/model/tts-store";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

type MessageBubbleProps = {
  message: ChatMessage;
  isStreaming?: boolean;
  processingStatus?: string | null;
};

function TtsButton({ message }: { message: ChatMessage }) {
  const isLoading = useTtsStore((state) => state.loadingMessageId === message.id);
  const isPlaying = useTtsStore((state) => state.playingMessageId === message.id);
  const toggle = useTtsStore((state) => state.toggle);

  const handleClick = () => {
    toggle(message.id, message.content).catch(() => {
      toast.error("음성을 재생하지 못했어요. 잠시 후 다시 시도해주세요.");
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={isPlaying ? "읽기 중지" : "답변 읽어주기"}
      className={cn(
        "mt-2 inline-flex h-7 w-7 items-center justify-center rounded-full transition-colors",
        "text-muted-foreground hover:bg-emerald-500/10 hover:text-emerald-700",
        (isLoading || isPlaying) && "text-emerald-700",
      )}
    >
      {isLoading ? (
        <Spinner className="size-3.5" />
      ) : isPlaying ? (
        <SquareIcon className="size-3.5 fill-current" />
      ) : (
        <Volume2Icon className="size-4" />
      )}
    </button>
  );
}

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
                {!isStreaming && message.content.trim().length > 0 && (
                  <TtsButton message={message} />
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});
