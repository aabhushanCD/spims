import { Moon, Sun } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/context/authContext";

export default function ThemeToggle() {
  const { t } = useTranslation();
  const { theme, toggleTheme } = useAuth();
  const isDark = theme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label={
        isDark ? t("topbar.switchToLight") : t("topbar.switchToDark")
      }
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
