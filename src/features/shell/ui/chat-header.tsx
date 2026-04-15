"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";

export function ChatHeader({
  onNewConversation,
}: {
  onNewConversation: () => void;
}) {
  return (
    <header className="flex items-center justify-between gap-4 pb-2">
      <div className="flex items-center gap-2">
        <div className="relative h-20 w-20">
          <Image
            src="/img/for-re_logo2.png"
            alt="포레"
            fill
            className="object-cover"
          />
        </div>
        <span className="text-lg font-bold text-emerald-800 dark:text-emerald-300">포레 AI</span>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onNewConversation}
        aria-label="새 대화 시작"
        className="rounded-2xl border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-400"
      >
        새 대화
      </Button>
    </header>
  );
}
