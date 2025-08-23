import toast from "react-hot-toast";

export const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

export async function apiFetch(path: string, options?: RequestInit) {
  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_BASE}${path}`, {
      credentials: "include",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options?.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    // Handle 401 as before
    if (res.status === 401) {
      toast.error("Unauthorized Activity. Please log in again.");
      window.dispatchEvent(new Event("unauthorized"));
      return res; // Return the response so caller can handle it
    }

    // Handle other errors
    if (!res.ok && res.status !== 401) {
      let errorMessage = `Error: ${res.status}`;
      
      try {
        const contentType = res.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
          // It's JSON - parse the error message
          const errorData = await res.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } else {
          // It's HTML or plain text - probably an error page
          const text = await res.text();
          
          if (text.includes('<!DOCTYPE') || text.includes('<html')) {
            // It's an HTML error page
            errorMessage = `Backend error: The server returned an error page instead of JSON. This usually means the endpoint doesn't exist or the backend is misconfigured.`;
          } else {
            // It's plain text
            errorMessage = `Error: ${res.status} ${text}`;
          }
        }
      } catch (parseError) {
        // If we can't parse the error response at all
        errorMessage = `Error: ${res.status} - Unable to read error details`;
      }

      toast.error(errorMessage);
    }

    return res;

  } catch (networkError) {
    // Handle network errors (fetch failed completely)
    if (networkError instanceof TypeError && networkError.message.includes('fetch')) {
      toast.error("Unable to connect to server. Please check your internet connection.");
    } else {
      toast.error("An unexpected error occurred. Please try again.");
    }
    
    // Re-throw so the calling code knows something went wrong
    throw networkError;
  }
}

// Helper function for when you expect JSON and want to handle the parsing gracefully
export async function apiFetchJson(path: string, options?: RequestInit) {
  try {
    const res = await apiFetch(path, options);
    
    if (!res.ok) {
      // apiFetch already showed the error toast
      throw new Error(`HTTP ${res.status}`);
    }

    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      toast.error("Server returned unexpected data format");
      throw new Error("Expected JSON response");
    }

    return await res.json();
  } catch (error) {
    if (error instanceof SyntaxError) {
      // This is the "<!DOCTYPE" parsing error
      toast.error("Server returned invalid data. Please refresh the page or contact support.");
      throw new Error("JSON parsing failed");
    }
    throw error;
  }
}