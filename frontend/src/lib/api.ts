import toast from "react-hot-toast";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

export async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });

  if (res.status === 401) {
    toast.error("Unauthorized Activity. Please log in again.");
    window.dispatchEvent(new Event("unauthorized"));
  }

  if (!res.ok && res.status !== 401) {
    const text = await res.text();
    toast.error(`Error: ${res.status} ${text}`);
    console.error(`API error on ${path}:`, res.status, text);
  }

  return res;
}
