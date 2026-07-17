import {
  createContext,
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
  role: string;
};

type AuthContextType = {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
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
  useEffect(() => {
    const data = async () => {
      setLoading(true);
      try {
        const user = await authServices.getCurrentUserService();
        setCurrentUser(user);
      } catch (err) {
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    };
    data();
  }, []);

  return (
    <AuthContext.Provider
      value={{ currentUser, setCurrentUser, isLoading, toggleTheme, theme }}
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
