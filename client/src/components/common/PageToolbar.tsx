import { Search } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

interface PageHeaderProps {
  title: string;
  description: string;

  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;

  action?: React.ReactNode;
}

export default function PageHeader({
  title,
  description,
  searchPlaceholder = "Search...",
  searchValue,
  onSearchChange,
  action,
}: PageHeaderProps) {
  
  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>

          <p className="text-muted-foreground text-sm">{description}</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex items-center gap-2 rounded-lg border px-3">
            <Search size={18} />

            <input
              value={searchValue}
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-10 w-full bg-transparent outline-none"
            />
          </div>

          {action}
        </div>
      </CardContent>
    </Card>
  );
}
