"use client";

import { useRef } from "react";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";

type CameraButtonProps = {
  onCapture: (file: File) => void;
  disabled?: boolean;
};

export function CameraButton({ onCapture, disabled }: CameraButtonProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onCapture(file);
    }
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleChange}
        className="hidden"
        aria-hidden="true"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
        aria-label="카메라로 식물 촬영"
        className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
      >
        <Camera className="h-5 w-5" aria-hidden="true" />
      </Button>
    </>
  );
}
