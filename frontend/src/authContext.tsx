import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

type AuthContextType = {
  token: string | null;
  user: {
    id: number;
    email: string;
    roles: string[];
  } | null;
  login: (newToken: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [user, setUser] = useState<{
    id: number;
    email: string;
    roles: string[];
  } | null>(null);

  const login = (newToken: string) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);

    const payload = JSON.parse(atob(newToken.split(".")[1]));
    setUser({
      id: payload.sub,
      email: payload.email,
      roles: payload.roles,
    });
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    navigate("/login");
  };

  const isAuthenticated = !!token;

  useEffect(() => {
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setUser({
          id: payload.sub,
          email: payload.email,
          roles: payload.roles,
        });
      } catch {
        setUser(null);
      }
    } else {
      setUser(null);
    }
  }, [token]);

  // Auto-logout on token expiration
  useEffect(() => {
    const interval = setInterval(() => {
      if (!token) return;

      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        if (payload.exp * 1000 < Date.now()) {
          logout();
        }
      } catch (err) {
        logout(); // fallback
      }
    }, 60 * 1000);

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
