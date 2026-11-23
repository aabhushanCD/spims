import { useId, useState } from "react";
import { NavLink, useLocation } from "react-router";
import { ChevronDown, type LucideIcon } from "lucide-react";

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
  onNavigate,
}: SidebarItemProps) {
  const { pathname } = useLocation();
  const panelId = useId();
  const hasActiveChild = Boolean(
    children?.some((child) => isNavPathActive(pathname, child.path)),
  );
  // Follow the active route until the user explicitly toggles the group.
  const [manualOpen, setManualOpen] = useState<boolean | null>(null);
  const open = manualOpen ?? hasActiveChild;

  // Menu with children
  if (children?.length) {
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

            <span>{title}</span>
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
              {child.title}
            </NavLink>
          ))}
        </div>
      </div>
    );
  }

  // Normal menu item
  return (
    <NavLink
      to={path ?? "/"}
      end={path === "/"}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          "focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
          isActive ? activeClasses : inactiveClasses,
        )
      }
    >
      <Icon size={18} aria-hidden="true" />

      {title}
    </NavLink>
  );
}
