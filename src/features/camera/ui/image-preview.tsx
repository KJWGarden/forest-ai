"use client";

import Image from "next/image";
import { X } from "lucide-react";

type ImagePreviewProps = {
  previewUrl: string;
  onRemove: () => void;
};

export function ImagePreview({ previewUrl, onRemove }: ImagePreviewProps) {
  return (
    <div className="relative inline-block animate-slide-up">
      <div className="relative h-16 w-16 overflow-hidden rounded-xl border-2 border-emerald-200 shadow-sm">
        <Image
          src={previewUrl}
          alt="촬영된 이미지"
          fill
          className="object-cover"
          unoptimized
        />
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow-sm transition hover:bg-red-600"
        aria-label="이미지 삭제"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
