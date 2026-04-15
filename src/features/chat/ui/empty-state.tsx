"use client";

import Image from "next/image";

export function EmptyState() {
  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-4">
      <div className="relative w-40 h-40 md:w-48 md:h-48 animate-float">
        <Image
          src="/img/fore.png"
          alt="포레"
          fill
          preload
          className="object-contain drop-shadow-lg"
        />
      </div>
      <div className="text-center space-y-2 px-4">
        <h2 className="text-xl font-bold text-emerald-800 dark:text-emerald-300">
          안녕! 나는 포레야 🌿
        </h2>
        <p className="text-sm text-muted-foreground max-w-[280px] leading-relaxed">
          숲에서 만난 식물이 궁금하다면
          <br />
          사진을 찍어서 보여줘!
        </p>
      </div>
    </div>
  );
}
