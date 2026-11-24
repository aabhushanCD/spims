import { Check, Languages } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePreferences } from "../context/preferencesContext";
import { LANGUAGES } from "../types/preferences.types";

export default function LanguageSwitcher() {
  const { t } = useTranslation();
  const { language, setLanguage, isSaving } = usePreferences();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={t("topbar.language")}
          title={t("topbar.language")}
          disabled={isSaving}
        >
          <Languages className="h-5 w-5" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>{t("topbar.language")}</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {LANGUAGES.map((option) => (
          <DropdownMenuItem
            key={option}
            onSelect={() => setLanguage(option)}
            className="flex items-center justify-between"
          >
            <span>{t(`language.${option}`)}</span>
            {language === option ? (
              <Check className="h-4 w-4" aria-hidden="true" />
            ) : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
