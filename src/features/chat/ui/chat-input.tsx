"use client";

import * as React from "react";
import { ArrowUp, Square } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CameraButton } from "@/features/camera/ui/camera-button";
import { ImagePreview } from "@/features/camera/ui/image-preview";
import type { ImageAttachment } from "@/features/chat/model/types";

type ChatInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSend: (value?: string) => void;
  onStop?: () => void;
  onCapture: (file: File) => void;
  isStreaming?: boolean;
  disabled?: boolean;
  pendingImages: ImageAttachment[];
  onRemoveImage: (uploadFileId: string) => void;
  isUploading?: boolean;
};

export function ChatInput({
  value,
  onChange,
  onSend,
  onStop,
  onCapture,
  isStreaming,
  disabled,
  pendingImages,
  onRemoveImage,
  isUploading,
}: ChatInputProps) {
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);
  const isComposingRef = React.useRef(false);

  React.useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    if (textarea.value !== value) {
      textarea.value = value;
    }
    if (!value) {
      textarea.scrollTop = 0;
    }
  }, [value]);

  React.useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";

    const computedStyle = window.getComputedStyle(textarea);
    const lineHeight = Number.parseFloat(computedStyle.lineHeight) || 24;
    const paddingTop = Number.parseFloat(computedStyle.paddingTop) || 0;
    const paddingBottom = Number.parseFloat(computedStyle.paddingBottom) || 0;
    const borderTopWidth = Number.parseFloat(computedStyle.borderTopWidth) || 0;
    const borderBottomWidth = Number.parseFloat(computedStyle.borderBottomWidth) || 0;
    const minHeight = 48;
    const maxHeight = lineHeight * 3 + paddingTop + paddingBottom + borderTopWidth + borderBottomWidth;
    const nextHeight = Math.max(minHeight, Math.min(textarea.scrollHeight, maxHeight));

    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? "auto" : "hidden";
  }, [value]);

  const triggerSend = React.useCallback(() => {
    const liveValue = textareaRef.current?.value ?? value;
    if ((!liveValue.trim() && pendingImages.length === 0) || isStreaming || disabled) {
      return;
    }
    onSend(liveValue);
  }, [disabled, isStreaming, onSend, value, pendingImages.length]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const nativeEvent = event.nativeEvent as KeyboardEvent & { isComposing?: boolean };
    const isImeComposing = nativeEvent.isComposing || nativeEvent.keyCode === 229;

    if (isComposingRef.current || isImeComposing) {
      return;
    }

    if (event.key === "Enter" && !event.shiftKey && !isStreaming && !disabled) {
      event.preventDefault();
      event.stopPropagation();
      void Promise.resolve().then(() => triggerSend());
    }
  };

  const isSendDisabled = disabled || isUploading || (!value.trim() && pendingImages.length === 0);

  return (
    <div className="space-y-2">
      {pendingImages.length > 0 && (
        <div className="flex gap-2 px-1">
          {pendingImages.map((img) => (
            <ImagePreview
              key={img.upload_file_id}
              previewUrl={img.previewUrl}
              onRemove={() => onRemoveImage(img.upload_file_id)}
            />
          ))}
        </div>
      )}
      <div className="relative rounded-[28px] border-2 border-emerald-400 bg-background shadow-[0_0_0_1px_rgba(52,211,153,0.38)] transition-all duration-300 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-400/40 dark:border-emerald-400 dark:shadow-[0_0_0_1px_rgba(52,211,153,0.3)]">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          onCompositionStart={() => {
            isComposingRef.current = true;
          }}
          onCompositionEnd={() => {
            isComposingRef.current = false;
          }}
          placeholder="식물에 대해 물어보세요..."
          disabled={disabled}
          aria-label="메시지 입력"
          className="min-h-[48px] w-full resize-none border-0 bg-transparent px-4 py-3 pr-24 text-base leading-6 text-foreground shadow-none focus-visible:ring-0 sm:text-sm placeholder:text-muted-foreground/70"
          rows={1}
        />
        <div className="absolute right-2 bottom-2 flex items-center gap-1">
          <CameraButton onCapture={onCapture} disabled={disabled || isStreaming} />
          <Button
            type="button"
            onClick={isStreaming ? onStop : triggerSend}
            disabled={isStreaming ? disabled : isSendDisabled}
            size="icon"
            aria-label={isStreaming ? "응답 중지" : "메시지 보내기"}
            className={`h-10 w-10 rounded-[16px] shadow-none hover:translate-y-0 ${
              isStreaming
                ? "bg-foreground text-background hover:bg-foreground/90"
                : "bg-emerald-600 text-white hover:bg-emerald-700"
            }`}
          >
            {isStreaming ? (
              <Square className="h-4 w-4 fill-current" aria-hidden="true" />
            ) : (
              <ArrowUp className="h-5 w-5" aria-hidden="true" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
