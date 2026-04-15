"use client";

import { create } from "zustand";

import { createId, createUserId } from "@/lib/id";
import {
  isGuestUserId,
  persistConversationId,
  persistGuestUserId,
  readConversationId,
  readGuestUserId,
  removeConversationId,
} from "@/features/chat/model/utils";
import type { ChatMessage, ChatStatus, ImageAttachment } from "@/features/chat/model/types";

type ChatState = {
  messages: ChatMessage[];
  conversationId: string | null;
  userId: string;
  status: ChatStatus;
  errorMessage: string | null;
  processingStatus: string | null;
  pendingImages: ImageAttachment[];
  hydrateSession: () => void;
  startNewConversation: () => void;
  addUserMessage: (text: string, images?: ImageAttachment[]) => void;
  startAssistantMessage: () => string;
  appendAssistantChunk: (messageId: string, chunk: string) => void;
  finalizeConversationId: (conversationId?: string | null) => void;
  ensureAssistantMessageContent: (messageId: string, content: string) => void;
  setError: (message: string) => void;
  clearError: () => void;
  setProcessingStatus: (status: string | null) => void;
  setPendingImages: (images: ImageAttachment[]) => void;
  addPendingImage: (image: ImageAttachment) => void;
  removePendingImage: (uploadFileId: string) => void;
  clearPendingImages: () => void;
};

function getOrCreateGuestUserId() {
  const storedGuestUserId = readGuestUserId();
  if (storedGuestUserId && storedGuestUserId.length > 0) {
    return storedGuestUserId;
  }

  const nextGuestUserId = createUserId();
  persistGuestUserId(nextGuestUserId);
  return nextGuestUserId;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  conversationId: null,
  userId: "",
  status: "idle",
  errorMessage: null,
  processingStatus: null,
  pendingImages: [],

  hydrateSession: () => {
    const nextUserId = getOrCreateGuestUserId();
    set({
      messages: [],
      conversationId: readConversationId(nextUserId) || null,
      userId: nextUserId,
      status: "idle",
      errorMessage: null,
      processingStatus: null,
      pendingImages: [],
    });
  },

  startNewConversation: () => {
    const currentUserId = get().userId;
    if (currentUserId) {
      removeConversationId(currentUserId);
    }
    set({
      messages: [],
      conversationId: null,
      status: "idle",
      errorMessage: null,
      processingStatus: null,
      pendingImages: [],
    });
  },

  addUserMessage: (text, images) => {
    const newMessage: ChatMessage = {
      id: createId(),
      role: "user",
      content: text,
      createdAt: Date.now(),
      images: images && images.length > 0 ? images : undefined,
    };
    set((state) => ({
      messages: [...state.messages, newMessage],
      pendingImages: [],
    }));
  },

  startAssistantMessage: () => {
    const messageId = createId();
    const newMessage: ChatMessage = {
      id: messageId,
      role: "assistant",
      content: "",
      createdAt: Date.now(),
    };
    set((state) => ({
      messages: [...state.messages, newMessage],
      status: "streaming",
      errorMessage: null,
      processingStatus: "식물을 관찰하고 있어요...",
    }));
    return messageId;
  },

  appendAssistantChunk: (messageId, chunk) => {
    set((state) => ({
      processingStatus: null,
      messages: state.messages.map((message) =>
        message.id === messageId ? { ...message, content: message.content + chunk } : message,
      ),
    }));
  },

  finalizeConversationId: (conversationId) => {
    set((state) => {
      const nextId =
        conversationId && conversationId.length > 0 ? conversationId : state.conversationId;
      if (nextId && state.userId) {
        persistConversationId(state.userId, nextId);
      }
      return {
        conversationId: nextId ?? null,
        status: "idle",
        processingStatus: null,
      };
    });
  },

  ensureAssistantMessageContent: (messageId, content) => {
    if (!content.trim()) return;
    set((state) => ({
      messages: state.messages.map((message) => {
        if (message.id !== messageId || message.role !== "assistant") return message;
        if (message.content.trim().length > 0) return message;
        return { ...message, content };
      }),
    }));
  },

  setError: (message) => {
    set({ status: "error", errorMessage: message, processingStatus: null });
  },

  clearError: () => {
    set({ errorMessage: null });
  },

  setProcessingStatus: (status) => {
    set({ processingStatus: status });
  },

  setPendingImages: (images) => {
    set({ pendingImages: images });
  },

  addPendingImage: (image) => {
    set((state) => ({ pendingImages: [...state.pendingImages, image] }));
  },

  removePendingImage: (uploadFileId) => {
    set((state) => ({
      pendingImages: state.pendingImages.filter((img) => img.upload_file_id !== uploadFileId),
    }));
  },

  clearPendingImages: () => {
    set({ pendingImages: [] });
  },
}));
