// src/api/storage.ts

const BASE = import.meta.env.VITE_VAULT_API_BASE || ""; // "" = same origin


function authHeaders(token: string) {
  if (!token) throw new Error("Not authenticated");
  return { Authorization: `Bearer ${token}` };
}

export async function listFiles(token: string) {
  const res = await fetch(`${BASE}/api/storage/list`, {
    headers: authHeaders(token),
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to list files");
  return res.json();
}

export async function uploadFiles(files: File[], token: string) {
  const fd = new FormData();
  files.forEach((f) => fd.append("file", f));
  const res = await fetch(`${BASE}/api/storage/upload`, {
    method: "POST",
    headers: authHeaders(token),
    body: fd,
    credentials: "include",
  });
  if (!res.ok) throw new Error("Upload failed");
  return res.json();
}

export async function deleteFile(id: number, token: string) {
  const res = await fetch(`${BASE}/api/storage/delete/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
    credentials: "include",
  });
  if (!res.ok) throw new Error("Delete failed");
  return res.json();
}

export async function downloadFile(id: number, token: string): Promise<Blob> {
  const res = await fetch(`${BASE}/api/storage/download/${id}`, {
    headers: authHeaders(token),
    credentials: "include",
  });
  if (!res.ok) throw new Error("Download failed");
  return res.blob();
}
