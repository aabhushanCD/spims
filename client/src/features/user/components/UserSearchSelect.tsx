import { useDeferredValue, useState } from "react";
import { Loader2, Search, UserRound, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useUserSearch } from "../hooks/useUser";
import type { User } from "../types/user.types";

interface Props {
  selected: User | null;
  onChange: (user: User | null) => void;
  placeholder?: string;
}

export default function UserSearchSelect({
  selected,
  onChange,
  placeholder = "Select user",
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const users = useUserSearch(deferredQuery);

  return (
    <div className="flex gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="w-full justify-start font-normal"
          >
            <UserRound className="mr-2 h-4 w-4" />
            <span className="truncate">
              {selected ? `${selected.name} (${selected.email})` : placeholder}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-80 p-2">
          <div className="relative">
            <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
            <Input
              className="pl-8"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search users..."
              autoFocus
            />
          </div>

          <div className="mt-2 max-h-64 space-y-1 overflow-y-auto">
            {users.isLoading ? (
              <div className="text-muted-foreground flex items-center gap-2 px-2 py-3 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading users...
              </div>
            ) : (users.data?.items.length ?? 0) === 0 ? (
              <p className="text-muted-foreground px-2 py-3 text-sm">
                No users found.
              </p>
            ) : (
              users.data?.items.map((user) => (
                <button
                  key={user._id}
                  type="button"
                  onClick={() => {
                    onChange(user);
                    setOpen(false);
                    setQuery("");
                  }}
                  className="hover:bg-muted flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm"
                >
                  <UserRound className="text-muted-foreground h-4 w-4" />
                  <span className="min-w-0">
                    <span className="block truncate font-medium">
                      {user.name}
                    </span>
                    <span className="text-muted-foreground block truncate text-xs">
                      {user.email}
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>

      {selected && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onChange(null)}
          aria-label="Clear selected user"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
