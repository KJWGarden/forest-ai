"use client";

type UploadFileResult = {
  id: string;
  name: string;
  size: number;
  extension: string;
  mime_type: string;
  created_by: string;
  created_at: number;
};

export async function uploadFile(file: File, userId: string): Promise<UploadFileResult> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("user", userId);

  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const message = payload?.error || `Upload failed (${response.status})`;
    throw new Error(typeof message === "string" ? message : "파일 업로드에 실패했습니다.");
  }

  return response.json();
}
