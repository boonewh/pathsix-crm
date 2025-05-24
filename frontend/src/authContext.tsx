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

  // Initialize from localStorage
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem("authUser");
    return stored ? JSON.parse(stored) : null;
  });

  // Login stores token and user in state and localStorage
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

  // Logout clears everything
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("authUser");
    setToken(null);
    setUser(null);
    navigate("/login");
  };

  const isAuthenticated = !!token;

  // Auto-logout when token expires
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
    }, 60 * 1000); // check every minute

    return () => clearInterval(interval);
  }, [token]);

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
