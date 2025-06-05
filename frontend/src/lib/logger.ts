export async function logFrontendError(message: string, context: any = {}) {
  try {
    await fetch(`${import.meta.env.VITE_API_BASE}/log-error`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, context }),
    });
  } catch {
    // Silent fail — don’t want logging to cause issues
  }
}
