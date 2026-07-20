// UserToolbar.tsx

import { Input } from "@/components/ui/input";

import UserDialog from "./UserDialog";

interface Props {
  search: string;

  setSearch: (value: string) => void;
}

export function UserToolbar({ search, setSearch }: Props) {
  return (
    <div className="flex justify-between gap-4">
      <Input
        placeholder="Search users..."

        value={search}

        onChange={(e) => setSearch(e.target.value)}
      />

      <UserDialog />
    </div>
  );
}
