import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/context/authContext";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useAuth();
  const isDark = theme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      aria-pressed={isDark}
    >
      {isDark ? (
        <Sun className="h-5 w-5" aria-hidden="true" />
      ) : (
        <Moon className="h-5 w-5" aria-hidden="true" />
      )}
    </Button>
  );
}
