// src/api/storage.ts
const BASE = (import.meta.env.VITE_API_BASE_URL as string) || "";

function join(base: string, path: string) {
  const b = base.replace(/\/+$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${b}${p}`;
}

export type FileInfo = {
  id: number;
  name: string;
  size: number;
  uploadedBy: string;
  date: string;
  mimetype?: string;
};

export async function listFiles(token: string): Promise<FileInfo[]> {
  const res = await fetch(join(BASE, "/storage/list"), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to list files");
  return res.json();
}

export async function uploadFiles(files: File[], token: string): Promise<void> {
  const form = new FormData();
  files.forEach((f) => form.append("files", f));

  const res = await fetch(join(BASE, "/storage/upload"), {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to upload files");
}

export async function deleteFile(id: number, token: string): Promise<void> {
  const res = await fetch(join(BASE, `/storage/delete/${id}`), {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to delete file");
}

export async function downloadFile(id: number, token: string): Promise<Blob> {
  const res = await fetch(join(BASE, `/storage/download/${id}`), {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to download file");
  return res.blob();
}
