import { useId, useState } from "react";
import { NavLink, useLocation } from "react-router";
import { ChevronDown, type LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface SidebarChild {
  title: string;
  path: string;
}

interface SidebarItemProps {
  title: string;
  icon: LucideIcon;
  path?: string;
  children?: SidebarChild[];
  /** Icon-only rail mode on desktop. */
  collapsed?: boolean;
  /** Called after a navigation link is clicked, e.g. to close the mobile sheet. */
  onNavigate?: () => void;
}

const activeClasses =
  "bg-sidebar-accent text-sidebar-accent-foreground font-medium";
const inactiveClasses =
  "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground";

function isNavPathActive(pathname: string, path: string) {
  return pathname === path || pathname.startsWith(`${path}/`);
}

export default function SidebarItem({
  title,
  icon: Icon,
  path,
  children,
  collapsed = false,
  onNavigate,
}: SidebarItemProps) {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const panelId = useId();
  const label = t(title);
  const hasActiveChild = Boolean(
    children?.some((child) => isNavPathActive(pathname, child.path)),
  );
  // Follow the active route until the user explicitly toggles the group.
  const [manualOpen, setManualOpen] = useState<boolean | null>(null);
  const open = manualOpen ?? hasActiveChild;

  // Menu with children
  if (children?.length) {
    if (collapsed) {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={label}
              className={cn(
                "flex w-full items-center justify-center rounded-lg px-0 py-2.5 text-sm font-medium transition-colors",
                "focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
                hasActiveChild ? activeClasses : inactiveClasses,
              )}
            >
              <Icon size={18} aria-hidden="true" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent side="right" align="start" className="w-48">
            <DropdownMenuLabel>{label}</DropdownMenuLabel>

            <DropdownMenuSeparator />

            {children.map((child) => {
              const active = isNavPathActive(pathname, child.path);

              return (
                <DropdownMenuItem key={child.path} asChild>
                  <NavLink
                    to={child.path}
                    onClick={onNavigate}
                    className={cn(
                      "w-full cursor-pointer",
                      active && "text-emerald-700 dark:text-emerald-300",
                    )}
                  >
                    {t(child.title)}
                  </NavLink>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }

    return (
      <div className="space-y-1">
        <button
          type="button"
          onClick={() => setManualOpen(!open)}
          aria-expanded={open}
          aria-controls={panelId}
          className={cn(
            "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            "focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
            hasActiveChild
              ? "bg-sidebar-accent/50 text-sidebar-accent-foreground"
              : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
          )}
        >
          <span className="flex items-center gap-3">
            <Icon size={18} aria-hidden="true" />

            <span>{label}</span>
          </span>

          <ChevronDown
            size={16}
            aria-hidden="true"
            className={cn("transition-transform", open && "rotate-180")}
          />
        </button>

        <div id={panelId} hidden={!open} className="mt-1 ml-6 space-y-1">
          {children.map((child) => (
            <NavLink
              key={child.path}
              to={child.path}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  "block rounded-lg px-3 py-2 text-sm transition-colors",
                  "focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
                  isActive ? activeClasses : inactiveClasses,
                )
              }
            >
              {t(child.title)}
            </NavLink>
          ))}
        </div>
      </div>
    );
  }

  // Normal menu item
  const link = (
    <NavLink
      to={path ?? "/"}
      end={path === "/"}
      onClick={onNavigate}
      aria-label={collapsed ? label : undefined}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          "focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
          collapsed && "justify-center px-0 py-2.5",
          isActive ? activeClasses : inactiveClasses,
        )
      }
    >
      <Icon size={18} aria-hidden="true" />

      {!collapsed && <span className="truncate">{label}</span>}
    </NavLink>
  );

  if (!collapsed) {
    return link;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>

      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}
