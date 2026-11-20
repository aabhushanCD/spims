import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { authServices } from "../services/authServices";

export type User = {
  _id: string;
  email: string;
  name: string;
  role: "owner" | "inventory_manager" | "pharmacist";
  isActive: boolean;
  emailVerified?: boolean;
};

type AuthContextType = {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  refreshCurrentUser: () => Promise<void>;
  isLoading: boolean;
  toggleTheme: () => void;
  theme: "light" | "dark";
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [isLoading, setLoading] = useState(true);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  const refreshCurrentUser = useCallback(async () => {
    try {
      const user = await authServices.getCurrentUserService();
      setCurrentUser(user);
    } catch {
      setCurrentUser(null);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const user = await authServices.getCurrentUserService();
        if (!cancelled) {
          setCurrentUser(user);
        }
      } catch {
        if (!cancelled) {
          setCurrentUser(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const handleSessionExpired = () => {
      setCurrentUser(null);
    };

    window.addEventListener("auth:session-expired", handleSessionExpired);

    return () => {
      window.removeEventListener(
        "auth:session-expired",
        handleSessionExpired,
      );
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        refreshCurrentUser,
        isLoading,
        toggleTheme,
        theme,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
