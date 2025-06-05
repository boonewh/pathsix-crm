import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

type AuthUser = {
  id: number;
  email: string;
  roles: string[];
};

type AuthContextType = {
  token: string | null;
  user: AuthUser | null;
  login: (newToken: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();

  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem("authUser");
    return stored ? JSON.parse(stored) : null;
  });

  const [loading, setLoading] = useState<boolean>(!!token && !user);
  const [showRetryMessage, setShowRetryMessage] = useState(false);
  const [showGiveUp, setShowGiveUp] = useState(false);

  const login = (newToken: string) => {
    try {
      const payload = JSON.parse(atob(newToken.split(".")[1]));

      const newUser: AuthUser = {
        id: payload.sub,
        email: payload.email,
        roles: payload.roles,
      };

      localStorage.setItem("token", newToken);
      localStorage.setItem("authUser", JSON.stringify(newUser));

      setToken(newToken);
      setUser(newUser);
    } catch (error) {
      console.error("Failed to parse JWT payload", error);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("authUser");
    setToken(null);
    setUser(null);
    navigate("/login");
  };

  const isAuthenticated = !!token;

  // 🔒 Auto-logout on expiration
  useEffect(() => {
    const interval = setInterval(() => {
      if (!token) return;

      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        if (payload.exp * 1000 < Date.now()) {
          console.warn("JWT expired, logging out");
          logout();
        }
      } catch (err) {
        console.warn("Failed to parse JWT, logging out");
        logout();
      }
    }, 60 * 1000);

    return () => clearInterval(interval);
  }, [token]);

  // 🔁 Verify token with retry on app load
  useEffect(() => {
    const fetchWithRetry = async (
      url: string,
      options: RequestInit = {},
      retries = 5,
      delay = 1500
    ): Promise<Response> => {
      try {
        const res = await fetch(url, options);
        if (!res.ok) throw new Error("Auth check failed");
        return res;
      } catch (err) {
        if (retries > 0) {
          await new Promise((res) => setTimeout(res, delay));
          return fetchWithRetry(url, options, retries - 1, delay * 1.5);
        }
        throw err;
      }
    };

    const verifyToken = async () => {
      if (!token || user) return;

      setLoading(true);

      const retryTimer = setTimeout(() => setShowRetryMessage(true), 5000);
      const giveUpTimer = setTimeout(() => setShowGiveUp(true), 15000);

      try {
        const res = await fetchWithRetry("/api/user", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        setUser(data);
      } catch (err) {
        console.warn("Token invalid or server unreachable, logging out");
        logout();
      } finally {
        clearTimeout(retryTimer);
        clearTimeout(giveUpTimer);
        setLoading(false);
      }
    };

    verifyToken();
  }, []);

  // ⏳ Connecting / Retry / Give Up UI
  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center text-lg text-gray-500 space-y-4 px-4 text-center">
        <div>🔄 Connecting to server…</div>
        {showRetryMessage && (
          <div className="text-sm text-gray-400">
            Still trying… this may be a cold start or temporary outage.
          </div>
        )}
        {showGiveUp && (
          <button
            onClick={logout}
            className="mt-2 px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 rounded"
          >
            Back to Login
          </button>
        )}
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ token, user, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export function userHasRole(user: AuthUser | null, role: string): boolean {
  return !!user?.roles?.includes(role);
}