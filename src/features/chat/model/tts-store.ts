"use client";

import { create } from "zustand";

type TtsState = {
  loadingMessageId: string | null;
  playingMessageId: string | null;
  toggle: (messageId: string, text: string) => Promise<void>;
  stop: () => void;
};

const audioUrlCache = new Map<string, string>();

let audio: HTMLAudioElement | null = null;
let activeRequest: AbortController | null = null;

async function fetchAudioUrl(messageId: string, text: string, signal: AbortSignal) {
  const cached = audioUrlCache.get(messageId);
  if (cached) return cached;

  const response = await fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
    signal,
  });

  if (!response.ok) {
    throw new Error("음성을 불러오지 못했어요.");
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  audioUrlCache.set(messageId, url);
  return url;
}

export const useTtsStore = create<TtsState>((set, get) => ({
  loadingMessageId: null,
  playingMessageId: null,

  stop: () => {
    activeRequest?.abort();
    activeRequest = null;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    set({ loadingMessageId: null, playingMessageId: null });
  },

  toggle: async (messageId, text) => {
    const { loadingMessageId, playingMessageId, stop } = get();

    // 같은 메시지를 다시 누르면 정지, 다른 메시지면 기존 재생을 끊고 새로 시작
    const isActive = loadingMessageId === messageId || playingMessageId === messageId;
    stop();
    if (isActive) return;

    const controller = new AbortController();
    activeRequest = controller;
    set({ loadingMessageId: messageId });

    try {
      const url = await fetchAudioUrl(messageId, text, controller.signal);
      if (controller.signal.aborted) return;

      if (!audio) {
        audio = new Audio();
        audio.onended = () => {
          useTtsStore.setState({ playingMessageId: null });
        };
        audio.onerror = () => {
          useTtsStore.setState({ playingMessageId: null, loadingMessageId: null });
        };
      }

      audio.src = url;
      await audio.play();
      if (controller.signal.aborted) return;

      set({ loadingMessageId: null, playingMessageId: messageId });
    } catch (error) {
      if (!controller.signal.aborted) {
        set({ loadingMessageId: null, playingMessageId: null });
        throw error;
      }
    } finally {
      if (activeRequest === controller) {
        activeRequest = null;
      }
    }
  },
}));
