export type ChatRole = "user" | "assistant" | "system";

export type ChatStatus = "idle" | "streaming" | "error";

export type ImageAttachment = {
  type: "image";
  transfer_method: "local_file";
  upload_file_id: string;
  previewUrl: string;
};

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: number;
  images?: ImageAttachment[];
};
