import { useState } from "react";
import { NavLink } from "react-router";
import { ChevronDown } from "lucide-react";

import type { LucideIcon } from "lucide-react";

interface SidebarChild {
  title: string;
  path: string;
}

interface SidebarItemProps {
  title: string;
  icon: LucideIcon;

  path?: string;

  children?: SidebarChild[];
}

export default function SidebarItem({
  title,
  icon: Icon,
  path,
  children,
}: SidebarItemProps) {
  const [open, setOpen] = useState(false);


  // Menu with children
  if (children) {
    return (
      <div className="space-y-1">
        <button
          onClick={() => setOpen(!open)}
          className="hover:bg-muted flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium"
        >
          <div className="flex items-center gap-3">
            <Icon size={18} />

            <span>{title}</span>
          </div>

          <ChevronDown
            size={16}
            className={`transition-transform ${open ? "rotate-180" : ""} `}
          />
        </button>

        {open && (
          <div className="ml-6 space-y-1">
            {children.map((child) => (
              <NavLink
                key={child.path}
                to={child.path}
                className={({ isActive }) =>
                  `block rounded-lg px-3 py-2 text-sm ${
                    isActive
                      ? "bg-emerald-600 text-white"
                      : "text-muted-foreground hover:bg-muted"
                  } `
                }
              >
                {child.title}
              </NavLink>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Normal menu item
  return (
    <NavLink
      to={path!}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${
          isActive ? "bg-emerald-600 text-white" : "hover:bg-muted"
        } `
      }
    >
      <Icon size={18} />

      {title}
    </NavLink>
  );
}
